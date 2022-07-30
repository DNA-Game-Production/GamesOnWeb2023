FROM node:16
ENV NODE_ENV=production

WORKDIR ./

COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production

COPY . .
CMD ["./target/release/tokyo_server"]