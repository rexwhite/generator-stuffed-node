FROM node:6.11.3

RUN useradd --user-group --create-home --shell /bin/false app

ENV HOME=/home/app
ENV NODE_ENV=production
ENV PORT=9000

WORKDIR $HOME/site

COPY package.json .
RUN npm install

COPY . .

USER app
EXPOSE 9000
CMD [ "npm", "start" ]
