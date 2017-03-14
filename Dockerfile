FROM node:latest
COPY . /code
WORKDIR /code
RUN npm install
CMD ["npm", "start"]
