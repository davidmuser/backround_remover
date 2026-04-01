# Use the official Python image
FROM python:3.11

# Set the working directory inside the container
WORKDIR /code

# Copy the requirements file
COPY ./requirements.txt /code/requirements.txt

# Install the dependencies
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the rest of the code
COPY . /code

# Command to run the application (Hugging Face requires port 7860)
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "7860"]