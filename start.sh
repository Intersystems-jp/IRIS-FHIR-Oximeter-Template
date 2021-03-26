#!/bin/bash
chmod 777 ./Out
docker-compose up -d --build
#
sleep 10
docker-compose ps
