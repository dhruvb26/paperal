###############################################################################
#
#  Welcome to Baml! To use this generated code, please run the following:
#
#  $ pip install baml
#
###############################################################################

# This file was generated by BAML: please do not edit it. Instead, edit the
# BAML files and re-generate this code.
#
# ruff: noqa: E501,F401
# flake8: noqa: E501,F401
# pylint: disable=unused-import,line-too-long
# fmt: off
import baml_py
from enum import Enum
from pydantic import BaseModel, ConfigDict
from typing import Dict, Generic, List, Literal, Optional, TypeVar, Union


T = TypeVar('T')
CheckName = TypeVar('CheckName', bound=str)

class Check(BaseModel):
    name: str
    expression: str
    status: str

class Checked(BaseModel, Generic[T,CheckName]):
    value: T
    checks: Dict[CheckName, Check]

def get_checks(checks: Dict[CheckName, Check]) -> List[Check]:
    return list(checks.values())

def all_succeeded(checks: Dict[CheckName, Check]) -> bool:
    return all(check.status == "succeeded" for check in get_checks(checks))



class CitationObject(BaseModel):
    in_text: str
    complete_reference: str
    url: str

class NewCitationObject(BaseModel):
    in_text: str
    complete_reference: str

class NewPage(BaseModel):
    sections: List["Section"]

class NewSection(BaseModel):
    title: str
    content: str
    references: List["CitationObject"]
    is_finished: bool

class Page(BaseModel):
    sections: List["Section"]

class Paper(BaseModel):
    author: List[str]
    title: str
    year: str
    abstract: str

class ReferenceObject(BaseModel):
    text: str
    url: str

class References(BaseModel):
    references: List["ReferenceObject"]

class Section(BaseModel):
    title: str
    content: str
    references: List["CitationObject"]
    is_finished: bool
