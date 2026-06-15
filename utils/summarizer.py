import os
from groq import Groq

def generate_summary(text):
    """
    Generates a summary of the provided text using Groq API.
    """
    if len(text.strip()) == 0:
        return "No text provided to summarize."
        
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    
    prompt = (
        "Please provide a concise, high-level summary of the following content in about 3-5 sentences:\n\n"
        f"Content: {text}"
    )

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert tutor who creates clear and concise summaries."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=300
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Summary generation failed: {str(e)}"
