import requests
import json
import os.path
import datetime
import calendar
from flask import Flask, request, jsonify, make_response
from flask_cors import CORS, cross_origin

app = Flask(__name__)
CORS(app, resources={r"*": {"origins": "*"}})

#Put the API KEY
OPENAI_API_KEY = "OPENAI_API_KEY"
url = "https://api.openai.com/v1/chat/completions"

headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {OPENAI_API_KEY}"
}

history_file = "conversation_history.json"
conversation_history = []

# check if conversation history file exists, and load history from it
if os.path.exists(history_file):
    with open(history_file, "r") as f:
        conversation_history = json.load(f)

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:19006')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.route('/clear_history', methods=['POST'])
def clear_history():
    global conversation_history
    conversation_history = []

    with open(history_file, "w") as f:
        json.dump(conversation_history, f)

    return jsonify({"status": "success"})

@app.route('/chat', methods=['POST'])
def chat():
    global conversation_history
    user_input = request.json["user_input"]
    conversation_history.append({"role": "user", "content": user_input})

    data = {
        "model": "gpt-3.5-turbo",
        "messages": conversation_history
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))
    response_data = response.json()

    ai_response = response_data['choices'][0]['message']['content']
    conversation_history.append({"role": "assistant", "content": ai_response})

    # save conversation history to file after every turn
    with open(history_file, "w") as f:
        json.dump(conversation_history, f)

    return jsonify({"ai_response": ai_response})

# @app.route('/tasks', methods=['POST'])
# def tasks():
#     global conversation_history
#     # Add your task handling logic here
#     return jsonify({"status": "success"})

# @app.route('/history', methods=['GET'])
# def get_history():
#     global conversation_history
#     return jsonify(conversation_history)

if __name__ == '__main__':
    app.run(debug=True)
