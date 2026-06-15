import os
from groq import Groq

def generate_structured_notes(text, task="notes"):
    """
    Uses Groq API to generate structured notes or key points.
    """
    client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
    
    if task == "notes":
        system_msg = "You are an expert tutor creating structured study notes."
        prompt = (
            "Convert the following content into structured study notes with headings, "
            "subheadings, and bullet points. Keep it simple and student-friendly.\n\n"
            f"Content: {text}"
        )
    elif task == "keywords":
        system_msg = "You are an expert tutor highlighting key concepts and terms."
        prompt = (
            "Extract the most important key points and keywords from the following content. "
            "Present them as a clear, concise bulleted list.\n\n"
            f"Content: {text}"
        )
    else:
        raise ValueError("Invalid task type.")

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_msg},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1500
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Generation failed: {str(e)}"
