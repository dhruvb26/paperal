Preprint
Engineer
Given the provided file structure and function definitions, an Engineer agent requires
only fundamental development skills to complete the development tasks. Due to the large number
of files, we present only one auto-generated code file here.
Generated code (color picker.py)
1
import tkinter as tk
2
from tkinter import colorchooser
3
class ColorPicker:
4
def __init__(self, root: tk.Tk, color: str = ’black’):
5
self.frame = tk.Frame(root)
6
self.color = color
7
8
self.color_button = tk.Button(self.frame, text=’Color’, command=self.select_color)
9
self.color_button.pack(fill=’x’)
10
11
def select_color(self):
12
color = colorchooser.askcolor()[1]
13
if color is not None:
14
self.color = color
15
16
def pack(self, **kwargs):
17
self.frame.pack(**kwargs)
18
19
def get_color(self):
20
return self.color
QA Engineer
Upon receiving the code output from the Engineer, the QA Engineer generates unit
test code and reviews it to identify and fix any bugs, ensuring high-quality software.
Generated Unit tests (test.py)
1
import unittest
2
import tkinter as tk
3
# You might want to move the ColorPicker class to another file, let’s say color_picker.py
4
# from color_picker import ColorPicker
5
6
class TestColorPicker(unittest.TestCase):
7
8
def setUp(self):
9
self.root = tk.Tk()
10
self.cp = ColorPicker(self.root)
11
12
def tearDown(self):
13
# This is important to close the tk window after tests
14
self.root.destroy()
15
16
def test_initial_color(self):
17
# Test the default color during initialization
18
self.assertEqual(self.cp.get_color(), ’black’)
19
20
def test_set_and_get_color(self):
21
# Test setting a new color and retrieving it
22
new_color = ’#ffffff’
# white color
23
self.cp.color = new_color
24
self.assertEqual(self.cp.get_color(), new_color)
25
26
27
if __name__ == ’__main__’:
28
unittest.main()
Output
Ultimately, as shown in Figure 10, MetaGPT generates a functional application named
“Drawing App”.
22
