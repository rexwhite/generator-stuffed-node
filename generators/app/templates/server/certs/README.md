# Securing Connections

To use https you'll need a certificate.  You can generate a self-signed
certificate for testing but the browser is going to complain that it
doesn't trust it.  This is fine for testing but you will want to get
a certificate from a Certificate Authority to use in production so
your users don't get the nasty warning.


### Generating A Self-Signed Certificate

To generate a self-signed certificate run the following command in
this directory:


```bash
openssl genrsa -des3 -passout pass:x -out ws.pass.key 2048
openssl rsa -passin pass:x -in ws.pass.key -out ws.key
openssl req -new -key ws.key -out ws.csr
openssl x509 -req -days 365 -in ws.csr -signkey ws.key -out ws.cert
```

When prompted for the Common Name (CN) in the third step, be sure to 
use the fully qualified domain name (FQDN) of your server.  You can get
this by running `hostname -f`


### Obtaining A Certificate From A Certificate Authority

Instructions vary by Certificate Authority but at some point they'll ask
for the certificate signing request (csr) that was generated in step 3
above.
