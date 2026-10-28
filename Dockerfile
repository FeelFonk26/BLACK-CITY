FROM node:22-bookworm-slim
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm install --include=dev
COPY . .
EXPOSE 4000
CMD ["npm", "run", "start", "--workspace=@black-city/api"]
