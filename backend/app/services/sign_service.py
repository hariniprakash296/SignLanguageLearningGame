class SignService:
    def __init__(self):
        # In a real app, this might talk to a DB or external API
        # For this implementation, we will use a curated set of ASL images
        self.base_asset_url = "/assets/asl/"

    def get_sign(self, query):
        label = query.upper()
        
        # Check if it's a letter
        if len(label) == 1:
            return {
                "label": label,
                "image_url": f"{self.base_asset_url}{label.lower()}.png",
                "description": f"ASL sign for letter {label}",
                "type": "letter"
            }
        
        # Check for words (mock support for now)
        return {
            "label": label,
            "image_url": None, # Placeholder for GIF/SVG
            "description": f"ASL sign for the word '{label}'",
            "type": "word"
        }
