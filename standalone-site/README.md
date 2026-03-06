# TudoAqui — Site Standalone

## Ficheiros
```
standalone-site/
├── index.html      # Página principal do site
├── styles.css      # Estilos CSS
├── script.js       # JavaScript (FAQ, menu, animações)
├── install.sh      # Script de instalação universal
└── README.md       # Este ficheiro
```

## Instalação Rápida

### Opção 1: Script Automático (Recomendado)
```bash
chmod +x install.sh
sudo ./install.sh
```
O script oferece 4 opções:
1. **Nginx** — Ideal para VPS/Cloud
2. **Apache** — Compatibilidade ampla
3. **Docker** — Container isolado
4. **Manual** — Apenas copia ficheiros

### Opção 2: Docker Manual
```bash
docker build -t tudoaqui-site .
docker run -d -p 80:80 --name tudoaqui-site tudoaqui-site
```

### Opção 3: Copiar para qualquer servidor web
Copie `index.html`, `styles.css` e `script.js` para o directório raiz do seu servidor web.

## Personalização
- Edite `index.html` para alterar textos, imagens e links
- Edite `styles.css` para alterar cores (variáveis CSS no `:root`)
- Os links "Entrar" e "Começar Grátis" devem apontar para o app principal

## SSL/HTTPS
Após instalar, adicione HTTPS:
```bash
# Nginx
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.ao

# Apache
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d seu-dominio.ao
```

## Empresa
**Sincesoft — Sinceridade Service**
NIF: 2403104787
Ave. Hoji ya Henda 132, Vila Alice, Rangel — Luanda, Angola
