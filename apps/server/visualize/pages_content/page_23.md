Preprint
Table 4: Executability comparison. The executability scores are on a grading system ranging from
’1’ to ’4’. A score of ’1’ signifies complete failure, ’2’ denotes executable code, ’3’ represents
largely satisfying expected workflow, and ’4’ indicates a perfect match with expectations.
Task
AutoGPT
LangChain
AgentVerse
ChatDev
MetaGPT
Flappy bird
1
1
1
2
3
Tank battle game
1
1
1
2
4
2048 game
1
1
1
1
4
Snake game
1
1
1
3
4
Brick breaker game
1
1
1
1
4
Excel data process
1
1
1
4
4
CRUD manage
1
1
1
2
4
Average score
1.0
1.0
1.0
2.1
3.9
Table 5: Performance of MetaGPT on SoftwareDev using different LLMs as agent backends.
Model
Open source Time(/s) # Lines Executability Revisions
MetaGPT (w/ GPT-3.5)
%
75.18
161.6
2.8
2.4
MetaGPT (w/ GPT-4)
%
552.94
178.2
3.8
1.2
MetaGPT (w/ Deepseek Coder 33B)
"
1186.20
120.2
1.4
2.6
Impact of Instruction Levels (High-level v.s. Detailed Instructions)
Does the variation in the
level of initial input from humans significantly influence performance outcomes? For examples:
1. High-level prompt: Create a brick breaker game.
2. Detailed prompt: Creating a brick breaker game. In a brick breaker game, the player
typically controls a paddle at the bottom of the screen to bounce a ball towards a wall of
bricks. The goal is to break all the bricks by hitting them with the ball.
Additional experiments were conducted to investigate this aspect: we selected 5 tasks from Soft-
wareDev, and constructed detailed prompts for them. Here are the experimental results:
Table 6: Impact of Instruction Levels. The executability is scored on a grading system ranging
from ‘1’ to ‘4’. A score of ‘1’ signifies complete failure, ‘2’ denotes runnable code, ‘3’ represents
largely expected workflow, and ‘4’ indicates a perfect match to expectations.
Model
# Word Time(/s) Token usage # Lines Executability Productivity Reversions
High-level
13.2
552.9
28384.2
178.2
3.8
163.8
1.2
Detailed
42.2
567.8
29657.0
257.0
4.0
118.0
1.6
We observe that: detailed prompts lead to better software projects with lower productivity ratios
because of clearer requirements and functions, while simple inputs can still generate good enough
software using MetaGPT with an executability rating of 3.8, which is comparable to the detailed
prompt scenario. (Note that, Productivity = Token usage / Total Code Lines. The lower this ratio,
the better.)
The performance of GPT variants in HumanEval benchmark
We use the GPT-4’s 67% Hu-
manEval score (OpenAI, 2023) as our baseline, acknowledging its acceptance in the HumanEval
benchmark. We further extend to experiments(five times) with GPT-4 (gpt-4-0613) and GPT-3.5-
Turbo (gpt-3.5-turbo-0613) under various conditions to assess performance. (A) We directly called
the OpenAI API with the prompt in HumanEval. (B) We called the OpenAI API and parsed the
code with regex in the response. (C) We added an additional system prompt, then called the OpenAI
API. The prompt is ”You are an AI that only responds with Python code, NOT ENGLISH. You will
24
