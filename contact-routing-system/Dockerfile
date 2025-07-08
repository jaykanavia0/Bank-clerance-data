FROM python:3.10-slim

WORKDIR /app

# Copy backend requirements and install
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy entire project
COPY . .

# Make sure models are available
# No need for COPY ../models as they're already in the structure

# Install frontend dependencies and build if needed
RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV FLASK_APP=backend/app.py
ENV FLASK_DEBUG=0

# Expose the port (Render will set PORT env var)
EXPOSE ${PORT:-5000}

# Run the backend
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-5000} backend.app:app"]