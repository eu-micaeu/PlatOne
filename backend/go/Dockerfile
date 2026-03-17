FROM golang:1.25-alpine AS build

WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/platone-backend ./main.go

FROM alpine:3.22 AS production

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=build /out/platone-backend ./platone-backend

EXPOSE 8085

CMD ["./platone-backend"]