FROM python:3.10-slim

WORKDIR /app

# Copy requirements first for better caching
COPY ./backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy models directory
COPY ./models ./models

# Copy all backend files
COPY ./backend/. .

ENV FLASK_APP=app.py
ENV FLASK_DEBUG=0

EXPOSE ${PORT:-5000}

CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} app:app"]