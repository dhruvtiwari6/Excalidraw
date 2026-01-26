FROM node:20-alpine

WORKDIR /app

COPY ./packages ./packages
COPY ./package-lock.json ./package-lock.json
COPY ./package.json ./package.json 
COPY ./turbo.json ./turbo.json

COPY ./apps/ws-backend ./apps/ws-backend

RUN npm install
RUN npm run db:generate


EXPOSE 3001

CMD ["npm" , "run" , "start:ws"]