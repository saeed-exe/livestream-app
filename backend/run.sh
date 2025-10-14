#!/usr/bin/env bash
ffmpeg -version >/dev/null 2>&1 || true
python app.py
