import os
import sys
import json
import torch
import numpy as np
import pandas as pd
from transformers import BertTokenizer, BertModel, pipeline
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import PCA
from sklearn.preprocessing import StandardScaler
from PIL import Image
from torchvision import models, transforms

# Device setup
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


class MemeRecommender:
    def __init__(self, dataset_path, image_dir):
        self.dataset_path = dataset_path
        self.image_dir = image_dir

        # Load models
        self.tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
        self.bert_model = BertModel.from_pretrained("bert-base-uncased").eval().to(device)
        self.resnet_model = models.resnet50(weights="IMAGENET1K_V1").eval().to(device)

        # Image preprocessing
        self.image_preprocess = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

        # Load dataset
        self.df = pd.read_csv(self.dataset_path)

        # Scaling and PCA for feature dimensionality reduction
        self.text_scaler = StandardScaler()
        self.image_scaler = StandardScaler()
        self.pca = PCA(n_components=50)

        # Preprocess features
        self.preprocess_features()

    def preprocess_text(self, text):
        return text.lower() if pd.notnull(text) else ""

    def extract_text_features(self, text):
        text = self.preprocess_text(text)
        inputs = self.tokenizer(text, return_tensors="pt", truncation=True, padding=True, max_length=128)
        inputs = {key: val.to(device) for key, val in inputs.items()}
        with torch.no_grad():
            outputs = self.bert_model(**inputs)
        return outputs.last_hidden_state[:, 0, :].cpu().numpy()

    def extract_image_features(self, image_filename):
        image_path = os.path.join(self.image_dir, image_filename.strip())
        if not os.path.exists(image_path):
            return np.zeros((1, 1000))

        image = Image.open(image_path).convert("RGB")
        input_tensor = self.image_preprocess(image).unsqueeze(0).to(device)
        with torch.no_grad():
            features = self.resnet_model(input_tensor)
        return features.cpu().numpy()

    def preprocess_features(self):
        self.df["text"] = self.df["text"].apply(self.preprocess_text)
        self.df["text_features"] = self.df["text"].apply(self.extract_text_features)
        self.df["image_features"] = self.df["image"].apply(self.extract_image_features)

        # Normalize and combine features
        text_features = np.vstack(self.df["text_features"])
        image_features = np.vstack(self.df["image_features"])

        text_features_scaled = self.text_scaler.fit_transform(text_features)
        image_features_scaled = self.image_scaler.fit_transform(image_features)

        combined_features = np.hstack((text_features_scaled, image_features_scaled))
        reduced_features = self.pca.fit_transform(combined_features)
        self.df["reduced_features"] = list(reduced_features)

    def recommend_memes(self, user_query, top_k=5):
        query_features = self.extract_text_features(user_query)
        query_features_scaled = self.text_scaler.transform(query_features)

        combined_features = np.hstack((query_features_scaled, np.zeros((1, 1000))))
        query_reduced = self.pca.transform(combined_features)

        similarities = cosine_similarity(query_reduced, np.vstack(self.df["reduced_features"]))[0]
        top_indices = np.argsort(similarities)[-top_k:][::-1]
        recommended_memes = self.df.iloc[top_indices]

        return [
            {"image_path": os.path.join(self.image_dir, meme["image"])} for _, meme in recommended_memes.iterrows()
        ]


def main():
    input_data = sys.stdin.read()
    messages = json.loads(input_data)

    dataset_path = "path/to/label2.csv"
    image_dir = "path/to/images"

    recommender = MemeRecommender(dataset_path, image_dir)
    last_message = messages[-1] if messages else ""
    recommended_memes = recommender.recommend_memes(last_message)

    print(json.dumps(recommended_memes))


if __name__ == '__main__':
    main()
