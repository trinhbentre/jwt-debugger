export type Language = 'nodejs' | 'python' | 'go' | 'java'
export type AlgoFamily = 'hmac' | 'rsa' | 'ec'

export interface SnippetContext {
  algorithm: string     // e.g. "HS256"
  algoFamily: AlgoFamily
  issuer?: string
  audience?: string
}

export function detectAlgoFamily(alg: string): AlgoFamily {
  const u = alg.toUpperCase()
  if (u.startsWith('HS')) return 'hmac'
  if (u.startsWith('RS') || u.startsWith('PS')) return 'rsa'
  return 'ec'
}

// ─── Node.js (jsonwebtoken) ───────────────────────────────────────────────────

const NODE_HMAC = (ctx: SnippetContext) => `\
const jwt = require('jsonwebtoken');

// HMAC ${ctx.algorithm} verification
const token = '<paste-your-token>';
const secret = process.env.JWT_SECRET; // min 32 chars

try {
  const payload = jwt.verify(token, secret, {
    algorithms: ['${ctx.algorithm}'],${ctx.issuer ? `\n    issuer: '${ctx.issuer}',` : ''}${ctx.audience ? `\n    audience: '${ctx.audience}',` : ''}
  });
  console.log('Valid token:', payload);
} catch (err) {
  console.error('Invalid token:', err.message);
}`

const NODE_RSA = (ctx: SnippetContext) => `\
const jwt = require('jsonwebtoken');
const fs = require('fs');

// RSA ${ctx.algorithm} verification
const token = '<paste-your-token>';
const publicKey = fs.readFileSync('./public.pem'); // SPKI PEM format

try {
  const payload = jwt.verify(token, publicKey, {
    algorithms: ['${ctx.algorithm}'],${ctx.issuer ? `\n    issuer: '${ctx.issuer}',` : ''}${ctx.audience ? `\n    audience: '${ctx.audience}',` : ''}
  });
  console.log('Valid token:', payload);
} catch (err) {
  console.error('Invalid token:', err.message);
}`

const NODE_EC = (ctx: SnippetContext) => `\
const jwt = require('jsonwebtoken');
const fs = require('fs');

// ECDSA ${ctx.algorithm} verification
const token = '<paste-your-token>';
const publicKey = fs.readFileSync('./ec-public.pem'); // EC SPKI PEM

try {
  const payload = jwt.verify(token, publicKey, {
    algorithms: ['${ctx.algorithm}'],${ctx.issuer ? `\n    issuer: '${ctx.issuer}',` : ''}${ctx.audience ? `\n    audience: '${ctx.audience}',` : ''}
  });
  console.log('Valid token:', payload);
} catch (err) {
  console.error('Invalid token:', err.message);
}`

// ─── Python (PyJWT) ───────────────────────────────────────────────────────────

const PYTHON_HMAC = (ctx: SnippetContext) => `\
import jwt  # pip install PyJWT

token = "<paste-your-token>"
secret = "your-secret-key"  # min 32 chars

try:
    payload = jwt.decode(
        token,
        secret,
        algorithms=["${ctx.algorithm}"],${ctx.issuer ? `\n        issuer="${ctx.issuer}",` : ''}${ctx.audience ? `\n        audience="${ctx.audience}",` : ''}
    )
    print("Valid token:", payload)
except jwt.ExpiredSignatureError:
    print("Token has expired")
except jwt.InvalidTokenError as e:
    print("Invalid token:", e)`

const PYTHON_RSA = (ctx: SnippetContext) => `\
import jwt  # pip install PyJWT cryptography

token = "<paste-your-token>"

with open("public.pem", "r") as f:
    public_key = f.read()

try:
    payload = jwt.decode(
        token,
        public_key,
        algorithms=["${ctx.algorithm}"],${ctx.issuer ? `\n        issuer="${ctx.issuer}",` : ''}${ctx.audience ? `\n        audience="${ctx.audience}",` : ''}
    )
    print("Valid token:", payload)
except jwt.ExpiredSignatureError:
    print("Token has expired")
except jwt.InvalidTokenError as e:
    print("Invalid token:", e)`

const PYTHON_EC = (ctx: SnippetContext) => `\
import jwt  # pip install PyJWT cryptography

token = "<paste-your-token>"

with open("ec-public.pem", "r") as f:
    public_key = f.read()

try:
    payload = jwt.decode(
        token,
        public_key,
        algorithms=["${ctx.algorithm}"],${ctx.issuer ? `\n        issuer="${ctx.issuer}",` : ''}${ctx.audience ? `\n        audience="${ctx.audience}",` : ''}
    )
    print("Valid token:", payload)
except jwt.ExpiredSignatureError:
    print("Token has expired")
except jwt.InvalidTokenError as e:
    print("Invalid token:", e)`

// ─── Go (golang-jwt) ─────────────────────────────────────────────────────────

const GO_HMAC = (_ctx: SnippetContext) => `\
package main

import (
    "fmt"
    "github.com/golang-jwt/jwt/v5"
)

func main() {
    tokenString := "<paste-your-token>"
    secret := []byte("your-secret-key") // min 32 chars

    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return secret, nil
    })

    if err != nil {
        fmt.Println("Invalid token:", err)
        return
    }
    if claims, ok := token.Claims.(jwt.MapClaims); ok {
        fmt.Println("Valid token:", claims)
    }
}`

const GO_RSA = (_ctx: SnippetContext) => `\
package main

import (
    "crypto/rsa"
    "fmt"
    "os"
    "github.com/golang-jwt/jwt/v5"
)

func main() {
    tokenString := "<paste-your-token>"
    pubKeyBytes, _ := os.ReadFile("public.pem")
    pubKey, err := jwt.ParseRSAPublicKeyFromPEM(pubKeyBytes)
    if err != nil {
        panic(err)
    }

    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodRSA); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return pubKey, nil
    })

    if err != nil {
        fmt.Println("Invalid token:", err)
        return
    }
    if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
        fmt.Println("Valid token:", claims)
    }
}

// Ensure correct key type
var _ *rsa.PublicKey = pubKey`

const GO_EC = (_ctx: SnippetContext) => `\
package main

import (
    "fmt"
    "os"
    "github.com/golang-jwt/jwt/v5"
)

func main() {
    tokenString := "<paste-your-token>"
    pubKeyBytes, _ := os.ReadFile("ec-public.pem")
    pubKey, err := jwt.ParseECPublicKeyFromPEM(pubKeyBytes)
    if err != nil {
        panic(err)
    }

    token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
        if _, ok := token.Method.(*jwt.SigningMethodECDSA); !ok {
            return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
        }
        return pubKey, nil
    })

    if err != nil {
        fmt.Println("Invalid token:", err)
        return
    }
    if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
        fmt.Println("Valid token:", claims)
    }
}`

// ─── Java (jjwt) ─────────────────────────────────────────────────────────────

const JAVA_HMAC = (ctx: SnippetContext) => `\
// Maven: io.jsonwebtoken:jjwt-api:0.12.6
//        io.jsonwebtoken:jjwt-impl:0.12.6
//        io.jsonwebtoken:jjwt-jackson:0.12.6
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

public class JwtVerifier {
    public static void main(String[] args) {
        String token = "<paste-your-token>";
        // Use key >= 32 chars for ${ctx.algorithm}
        SecretKey key = Keys.hmacShaKeyFor(
            "your-secret-key-at-least-32-chars".getBytes(StandardCharsets.UTF_8)
        );

        try {
            var claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
            System.out.println("Valid. Subject: " + claims.getSubject());
        } catch (Exception e) {
            System.err.println("Invalid token: " + e.getMessage());
        }
    }
}`

const JAVA_RSA = (_ctx: SnippetContext) => `\
// Maven: io.jsonwebtoken:jjwt-api:0.12.6
//        io.jsonwebtoken:jjwt-impl:0.12.6
//        io.jsonwebtoken:jjwt-jackson:0.12.6
import io.jsonwebtoken.Jwts;
import java.security.PublicKey;
import java.security.KeyFactory;
import java.security.spec.X509EncodedKeySpec;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;

public class JwtVerifier {
    public static void main(String[] args) throws Exception {
        String token = "<paste-your-token>";

        // Load RSA public key from PEM
        String pem = new String(Files.readAllBytes(Paths.get("public.pem")))
            .replaceAll("-----.*-----", "").replaceAll("\\s", "");
        PublicKey key = KeyFactory.getInstance("RSA")
            .generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(pem)));

        try {
            var claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
            System.out.println("Valid. Subject: " + claims.getSubject());
        } catch (Exception e) {
            System.err.println("Invalid token: " + e.getMessage());
        }
    }
}`

const JAVA_EC = (_ctx: SnippetContext) => `\
// Maven: io.jsonwebtoken:jjwt-api:0.12.6
//        io.jsonwebtoken:jjwt-impl:0.12.6
//        io.jsonwebtoken:jjwt-jackson:0.12.6
import io.jsonwebtoken.Jwts;
import java.security.PublicKey;
import java.security.KeyFactory;
import java.security.spec.X509EncodedKeySpec;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;

public class JwtVerifier {
    public static void main(String[] args) throws Exception {
        String token = "<paste-your-token>";

        // Load EC public key from PEM
        String pem = new String(Files.readAllBytes(Paths.get("ec-public.pem")))
            .replaceAll("-----.*-----", "").replaceAll("\\s", "");
        PublicKey key = KeyFactory.getInstance("EC")
            .generatePublic(new X509EncodedKeySpec(Base64.getDecoder().decode(pem)));

        try {
            var claims = Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
            System.out.println("Valid. Subject: " + claims.getSubject());
        } catch (Exception e) {
            System.err.println("Invalid token: " + e.getMessage());
        }
    }
}`

// ─── Template matrix ──────────────────────────────────────────────────────────

type TemplateFn = (ctx: SnippetContext) => string

const TEMPLATES: Record<Language, Record<AlgoFamily, TemplateFn>> = {
  nodejs: { hmac: NODE_HMAC, rsa: NODE_RSA, ec: NODE_EC },
  python: { hmac: PYTHON_HMAC, rsa: PYTHON_RSA, ec: PYTHON_EC },
  go:     { hmac: GO_HMAC,   rsa: GO_RSA,   ec: GO_EC   },
  java:   { hmac: JAVA_HMAC, rsa: JAVA_RSA, ec: JAVA_EC  },
}

export function generateSnippet(lang: Language, ctx: SnippetContext): string {
  return TEMPLATES[lang][ctx.algoFamily](ctx)
}

export const LANGUAGE_LABELS: Record<Language, string> = {
  nodejs: 'Node.js',
  python: 'Python',
  go: 'Go',
  java: 'Java',
}
