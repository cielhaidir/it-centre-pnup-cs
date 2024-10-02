FROM node:18 AS whatsapp_web_base                                

ENV DEBIAN_FRONTEND noninteractive

RUN apt-get update \
    && apt-get install -y ca-certificates fonts-liberation libappindicator3-1 libasound2 \
    libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
    libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 \
    libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
    
WORKDIR /app


COPY ./package*.json ./

EXPOSE 3000

FROM whatsapp_web_base AS production
ENV NODE_ENV=production
RUN npm ci
COPY . .
CMD ["node", "--trace-warnings", "app.js"]

FROM whatsapp_web_base AS development
ENV NODE_ENV=development
RUN npm install -g nodemon
RUN npm install
