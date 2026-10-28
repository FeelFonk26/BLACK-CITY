FROM node:22-bookworm-slim
WORKDIR /app
COPY . .
RUN npm install --include=dev
ENV NODE_ENV=production
EXPOSE 4000
CMD ["npm", "run", "start", "--workspace=@black-city/api"]
