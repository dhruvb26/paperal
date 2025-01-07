from fastapi import APIRouter
from models.visualize import VisualizeRequest
from utils.pdf_to_latex import pdf_to_latex

router = APIRouter()


@router.post("/visualize")
async def visualize(request: VisualizeRequest):
    # pdf_url is a pdf

    sections = pdf_to_latex(request.pdf_url + ".pdf", "output.tex")
    return {"sections": sections}
