#!/bin/bash
# ============================================================
# TudoAqui - Script de Instalação Universal
# Funciona com: Nginx, Apache, Docker
# Sincesoft - Sinceridade Service | NIF: 2403104787
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

SITE_DIR="/var/www/tudoaqui"
DOMAIN="tudoaqui.ao"

echo -e "${CYAN}"
echo "╔══════════════════════════════════════════════╗"
echo "║       TudoAqui - Instalação do Site          ║"
echo "║       O Super App de Angola                  ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================
# Menu de Selecção
# ============================================================
echo -e "${YELLOW}Seleccione o método de instalação:${NC}"
echo ""
echo "  1) Nginx  (recomendado para VPS/Cloud)"
echo "  2) Apache (compatibilidade ampla)"
echo "  3) Docker (container isolado)"
echo "  4) Apenas copiar ficheiros (manual)"
echo ""
read -p "Opção [1-4]: " INSTALL_METHOD

read -p "Domínio do site [${DOMAIN}]: " USER_DOMAIN
DOMAIN=${USER_DOMAIN:-$DOMAIN}

read -p "Directório de instalação [${SITE_DIR}]: " USER_DIR
SITE_DIR=${USER_DIR:-$SITE_DIR}

echo ""
echo -e "${CYAN}Configuração:${NC}"
echo "  Método: $INSTALL_METHOD"
echo "  Domínio: $DOMAIN"
echo "  Directório: $SITE_DIR"
echo ""
read -p "Confirmar? (s/n): " CONFIRM
if [[ "$CONFIRM" != "s" && "$CONFIRM" != "S" && "$CONFIRM" != "y" && "$CONFIRM" != "Y" ]]; then
    echo "Instalação cancelada."
    exit 0
fi

# ============================================================
# Copiar ficheiros do site
# ============================================================
copy_site_files() {
    echo -e "${GREEN}[1/4] Criando directório...${NC}"
    sudo mkdir -p "$SITE_DIR"
    
    echo -e "${GREEN}[2/4] Copiando ficheiros do site...${NC}"
    SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
    
    if [ -f "$SCRIPT_DIR/index.html" ]; then
        sudo cp "$SCRIPT_DIR/index.html" "$SITE_DIR/"
        sudo cp "$SCRIPT_DIR/styles.css" "$SITE_DIR/" 2>/dev/null || true
        sudo cp "$SCRIPT_DIR/script.js" "$SITE_DIR/" 2>/dev/null || true
        sudo cp -r "$SCRIPT_DIR/assets" "$SITE_DIR/" 2>/dev/null || true
    else
        echo -e "${RED}ERRO: index.html não encontrado em $SCRIPT_DIR${NC}"
        echo "Certifique-se de que os ficheiros do site estão na mesma pasta que este script."
        exit 1
    fi
    
    sudo chown -R www-data:www-data "$SITE_DIR" 2>/dev/null || true
    sudo chmod -R 755 "$SITE_DIR"
}

# ============================================================
# Instalação Nginx
# ============================================================
install_nginx() {
    echo -e "${GREEN}[3/4] Configurando Nginx...${NC}"
    
    if ! command -v nginx &> /dev/null; then
        echo "Instalando Nginx..."
        sudo apt-get update -qq && sudo apt-get install -y nginx
    fi
    
    sudo tee /etc/nginx/sites-available/tudoaqui > /dev/null << NGINX_EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    
    root ${SITE_DIR};
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 1000;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Cache static assets
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    
    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Error pages
    error_page 404 /index.html;
}
NGINX_EOF
    
    sudo ln -sf /etc/nginx/sites-available/tudoaqui /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl restart nginx
    
    echo -e "${GREEN}[4/4] Nginx configurado!${NC}"
    
    echo ""
    echo -e "${YELLOW}Para SSL/HTTPS (recomendado):${NC}"
    echo "  sudo apt install certbot python3-certbot-nginx"
    echo "  sudo certbot --nginx -d ${DOMAIN} -d www.${DOMAIN}"
}

# ============================================================
# Instalação Apache
# ============================================================
install_apache() {
    echo -e "${GREEN}[3/4] Configurando Apache...${NC}"
    
    if ! command -v apache2 &> /dev/null; then
        echo "Instalando Apache..."
        sudo apt-get update -qq && sudo apt-get install -y apache2
    fi
    
    sudo a2enmod rewrite headers expires 2>/dev/null || true
    
    sudo tee /etc/apache2/sites-available/tudoaqui.conf > /dev/null << APACHE_EOF
<VirtualHost *:80>
    ServerName ${DOMAIN}
    ServerAlias www.${DOMAIN}
    DocumentRoot ${SITE_DIR}
    
    <Directory ${SITE_DIR}>
        AllowOverride All
        Require all granted
        Options -Indexes
        
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Security headers
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    
    # Compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/css application/json application/javascript
    </IfModule>
    
    # Cache
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType text/css "access plus 30 days"
        ExpiresByType application/javascript "access plus 30 days"
        ExpiresByType image/png "access plus 30 days"
        ExpiresByType image/jpeg "access plus 30 days"
    </IfModule>
    
    ErrorLog \${APACHE_LOG_DIR}/tudoaqui_error.log
    CustomLog \${APACHE_LOG_DIR}/tudoaqui_access.log combined
</VirtualHost>
APACHE_EOF
    
    sudo a2ensite tudoaqui.conf
    sudo a2dissite 000-default.conf 2>/dev/null || true
    sudo apache2ctl configtest && sudo systemctl restart apache2
    
    echo -e "${GREEN}[4/4] Apache configurado!${NC}"
    
    echo ""
    echo -e "${YELLOW}Para SSL/HTTPS (recomendado):${NC}"
    echo "  sudo apt install certbot python3-certbot-apache"
    echo "  sudo certbot --apache -d ${DOMAIN} -d www.${DOMAIN}"
}

# ============================================================
# Instalação Docker
# ============================================================
install_docker() {
    echo -e "${GREEN}[3/4] Criando ficheiros Docker...${NC}"
    
    # Create Dockerfile
    sudo tee "$SITE_DIR/Dockerfile" > /dev/null << 'DOCKER_EOF'
FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY styles.css /usr/share/nginx/html/ 
COPY script.js /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
DOCKER_EOF
    
    # Create Nginx config for Docker
    sudo tee "$SITE_DIR/nginx.conf" > /dev/null << 'NGINX_DOCKER_EOF'
server {
    listen 80;
    root /usr/share/nginx/html;
    index index.html;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
        expires 30d;
    }
}
NGINX_DOCKER_EOF
    
    # Create docker-compose.yml
    sudo tee "$SITE_DIR/docker-compose.yml" > /dev/null << COMPOSE_EOF
version: '3.8'
services:
  tudoaqui-site:
    build: .
    ports:
      - "80:80"
    restart: unless-stopped
    container_name: tudoaqui-site
COMPOSE_EOF
    
    echo -e "${GREEN}[4/4] Ficheiros Docker criados!${NC}"
    echo ""
    echo -e "${YELLOW}Para iniciar com Docker:${NC}"
    echo "  cd $SITE_DIR"
    echo "  docker-compose up -d"
    echo ""
    echo -e "${YELLOW}Para iniciar sem docker-compose:${NC}"
    echo "  cd $SITE_DIR"
    echo "  docker build -t tudoaqui-site ."
    echo "  docker run -d -p 80:80 --name tudoaqui-site tudoaqui-site"
}

# ============================================================
# Executar instalação
# ============================================================
copy_site_files

case $INSTALL_METHOD in
    1) install_nginx ;;
    2) install_apache ;;
    3) install_docker ;;
    4) 
        echo -e "${GREEN}[3/4] Ficheiros copiados para $SITE_DIR${NC}"
        echo -e "${GREEN}[4/4] Configure o seu servidor web manualmente.${NC}"
        ;;
    *)
        echo -e "${RED}Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       Instalação Concluída!                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Site instalado em: $SITE_DIR${NC}"
echo -e "${GREEN}Domínio: http://$DOMAIN${NC}"
echo ""
echo -e "${YELLOW}Próximos passos:${NC}"
echo "  1. Configure o DNS do domínio $DOMAIN para o IP do servidor"
echo "  2. Instale certificado SSL (HTTPS)"
echo "  3. Personalize as imagens e textos em index.html"
echo ""
echo -e "${CYAN}Sincesoft — Sinceridade Service | TudoAqui${NC}"
