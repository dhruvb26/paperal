Preprint
B
A DEMO OF THE EXECUTION
In this section, we outline the complete process of software development using MetaGPT. It begins
with a user’s input command (as shown in Appendix B.1) and ends with software designed according
to the user’s specifications.
B.1
USER INPUT
Upon receiving an instruction from the user, MetaGPT collaborates with a professional development
team to fulfill the task. Here is a demo of user input:
User input
1
write a python3 GUI app such that you can draw an image with it
B.2
METAGPT DEVELOPMENT PROCESS
Now we provide a step-by-step explanation of the standardized output process for each agent.
Product Manager
The Product Manager generates a Product Requirement Document (PRD), as
detailed in the specified documentation. This document encompasses goals, user stories, competitive
analysis, requirement analysis and requirement pool. Additionally, a competitive quadrant chart is
produced (see Figure 7). Subsequently, these documents and charts are handed over to the architect
for system design.
Product Requirement Document
1
## Original Requirements
2
The boss requires a Python3 GUI color meter that outputs the RGB values when it moves.
3
4
## Product Goals
5
‘‘‘python
6
[
7
"Create a user-friendly GUI color meter",
8
"Ensure the color meter accurately outputs RGB values",
9
"Ensure the color meter updates RGB values in real-time as it moves"
10
]
11
‘‘‘
12
13
## User Stories
14
‘‘‘python
15
[
16
"As a user, I want to select any color on the screen, so that I can get its RGB values",
17
"As a user, I want the RGB values to update in real-time as I move the color meter, so that I
,→can get accurate color information",
18
"As a user, I want a simple and intuitive interface, so that I can easily use the color meter"
19
]
20
‘‘‘
21
22
## Competitive Analysis
23
‘‘‘python
24
[
25
"Color Cop: A popular color picker for Windows. It’s simple and easy to use, but lacks real-
,→time RGB value updates",
26
"Just Color Picker: Offers real-time color picking and multiple color code formats. However,
,→its interface is cluttered and not very user-friendly",
27
"Instant Eyedropper: A simple color picker that lives in the system tray. It’s convenient but
,→lacks advanced features",
28
"ColorZilla: A color picker extension for browsers. It’s convenient for web design but not
,→suitable for desktop applications",
29
"ColorPic: Offers color palettes and mixer tools. It’s feature-rich but can be overwhelming
,→for simple tasks"
30
]
31
‘‘‘
17
