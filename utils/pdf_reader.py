import PyPDF2
from docx import Document

def extract_text_from_pdf(uploaded_file):
    """
    Extracts text from a PyPDF2 uploaded file object.
    """
    try:
        pdf_reader = PyPDF2.PdfReader(uploaded_file)
        text = ""
        for page in pdf_reader.pages:
            if page.extract_text():
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Error extracting text from PDF: {str(e)}"

def extract_text_from_txt(uploaded_file):
    """
    Extracts text from a standard TXT uploaded file object.
    """
    try:
        return uploaded_file.getvalue().decode("utf-8")
    except Exception as e:
        return f"Error extracting text from TXT: {str(e)}"

def extract_text_from_docx(uploaded_file):
    """
    Extracts text from a DOCX uploaded file object.
    """
    try:
        doc = Document(uploaded_file)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    except Exception as e:
        return f"Error extracting text from DOCX: {str(e)}"
