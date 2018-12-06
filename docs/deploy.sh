#!/usr/bin/env bash

ssh -t root@10.96.94.162 "rm -rf /usr/share/nginx/html/mpx/*"
scp -r _book/* root@10.96.94.162:/usr/share/nginx/html/mpx
