import multiprocessing

# Number of workers
workers = multiprocessing.cpu_count() * 2 + 1
# Timeout
timeout = 300
worker_class = "uvicorn.workers.UvicornWorker"
bind = "0.0.0.0:10000"
