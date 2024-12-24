# Ragscale Backend

This is for demonstration purposes only. It is a simple backend that provides a REST API for Devscale Workshop.

## Installation

```bash
bun install
```

## Prepare the database

Before you can run the application, you need to prepare the database.
ChromaDB is used for Vector Database
Redis is used for Task Queue

```bash
docker pull chromadb/chroma
docker pull redis

docker run --name ragscale-redis -d -p 6379:6379 redis
docker run --name ragscale-chromadb -d -p 8090:8000 chromadb/chroma
```
