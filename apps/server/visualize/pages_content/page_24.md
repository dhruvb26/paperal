Preprint
be given a function signature and its docstring by the user. Write your full implementation (restate
the function signature).” As shown in Table 7, GPT-4 is more sensitive to prompt, code parser, and
post-processing results on the HumanEval data set. It is difficult for GPT-3.5-Turbo to return the
correct completion code without prompt words.
Table 7: Performance of GPT models on HumanEval. Experiments were conducted five times
using gpt-4-0613 and gpt-3.5-turbo-0613 with different settings.
Settings
Model
1
2
3
4
5
Avg.
Std.
A
gpt-4-0613
0.732
0.707
0.732
0.713
0.738
0.724
0.013
A
gpt-3.5-turbo-0613
0.360
0.366
0.360
0.348
0.354
0.357
0.007
B
gpt-4-0613
0.787
0.811
0.817
0.829
0.817
0.812
0.016
B
gpt-3.5-turbo-0613
0.348
0.354
0.348
0.335
0.348
0.346
0.007
C
gpt-4-0613
0.805
0.805
0.817
0.793
0.780
0.800
0.014
C
gpt-3.5-turbo-0613
0.585
0.567
0.573
0.579
0.579
0.577
0.007
Qualitative results
Figure 11 and Figure 12 illustrate the outcomes of the Architect agent’s ef-
forts to design a complex recommender system. These figures showcase the comprehensive system
interface design and program call flow. The latter is essential for creating a sophisticated automated
system. It is crucial to emphasize the importance of this division of labor in developing an automated
software framework.
D
LIMITATION AND ETHICS CONCERNS
D.1
LIMITATION
System side
At present, our system cannot fully cater to specific scenarios, such as UI and front-
end, as we have yet to incorporate such agents and multimodal tools. Furthermore, despite gen-
erating the most amount of code among comparable frameworks, it remains challenging to fulfill
real-world applications’ diverse and complex requirements.
Human user side
A key challenge for users is to interrupt the running process of each agent, or
set the starting running point (checkpoint) for each agent.
D.2
ETHICS CONCERNS
Unemployment and Skill Obsolescence
MetaGPT enables more people to program in natural
languages, thereby making it easier for engineers to get started. Over the years, programming
languages have evolved from punched cards to assembly, C, Java, Python, and now natural lan-
guage. As a result, humans have become more proficient at programming, increasing the demand
for programming-related positions. Furthermore, programming with natural language may offer a
significantly easier learning curve, making programming more accessible to a broader audience.
Transparency and Accountability
MetaGPT is an open-source framework that facilitates inter-
active communication between multiple agents through natural language. Humans can initiate, ob-
serve, and stop running with the highest level of control. It provides real-time interpretation and op-
eration of the natural language, displayed on the screen and logs, ensuring transparency. MetaGPT
enhances “natural language programming” capabilities, and human engineers are the users and re-
sponsible for the outcomes.
Privacy and Data Security
MetaGPT operates locally, ensuring user data privacy and security. It
does not collect user data. For interactions with third-party LLMs, such as those by OpenAI, users
are encouraged to refer to the respective privacy policies (e.g., OpenAI Privacy Policy). However,
we provide the option of open-source LLMs as backends.
25
