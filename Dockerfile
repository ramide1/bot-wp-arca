FROM alpine:3.24
RUN apk update
RUN apk add --no-cache bash chromium openssl ffmpeg
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"
WORKDIR /app
COPY . .
RUN bun install
ARG USER=appuser
RUN \
	adduser -D ${USER}; \
	chown -R ${USER}:${USER} /app
USER ${USER}
EXPOSE 3000
CMD ["bun", "src/main.ts"]