Preprint
A
OUTLOOK
A.1
SELF-IMPROVEMENT MECHANISMS
One limitation of the MetaGPT version in the main text of this paper is that each software project is
executed independently. However, through active teamwork, a software development team should
learn from the experience gained by developing each project, thus becoming more compatible and
successful over time.
This is somewhat related to the idea of recursive self-improvement, first informally proposed in
1965 (Good, 1965), with first concrete implementations since 1987 (Schmidhuber, 1987; 1993b;
Schmidhuber et al., 1998), culminating in the concept of mathematically optimal self-referential
self-improvers (Schmidhuber, 2003; 2009). Generally speaking, a system should learn from experi-
ence in the real world, and meta-learn better learning algorithms from experiences of learning, and
meta-meta-learn better meta-learning algorithms from experiences of meta-learning, etc., without
any limitations except those of computability and physics.
More recent, somewhat related work leverages the reasoning ability of Large Language Models
(LLMs) and recursively improves prompts of LLMs, to improve performance on certain downstream
tasks (Fernando et al., 2023; Zelikman et al., 2023), analogous to the adaptive prompt engineer of
2015 (Schmidhuber, 2015) where one neural network learns to generate sequence of queries or
prompts for another pre-trained neural network whose answers may help the first network to learn
new tasks more quickly.
In our present work, we also explore a self-referential mechanism that recursively modifies the con-
straint prompts of agents based on information they observe during software development. Our
initial implementation works as follows. Prior to each project, every agent in the software company
reviews previous feedback and makes necessary adjustments to their constraint prompts. This en-
ables them to continuously learn from past project experiences and enhance the overall multi-agent
system by improving each individual in the company. We first establish a handover feedback action
for each agent. This action is responsible for critically summarizing the information received dur-
ing the development of previous projects and integrating this information in an updated constraint
prompt. The summarized information is stored in long-term memory such that it can be inherited
by future constraint prompt updates. When initiating a new project, each agent starts with a react
action. Each agent evaluates the received feedback and summarizes how they can improve in a
constraint prompt.
One current limitation is that these summary-based optimizations only modify constraints in the
specialization of roles (Sec. 3.1) rather than structured communication interfaces in communication
protocols (Sec. 3.2). Future advancements are yet to be explored.
A.2
MULTI-AGENT ECONOMIES
In real-world teamwork, the interaction processes are often not hardcoded. For example, in a soft-
ware company, the collaboration SOP may change dynamically.
One implementation of such self-organization is discussed in the paper on a “Natural Language-
Based Society of Mind” (NLSOM) (Zhuge et al., 2023), which introduced the idea of an “Economy
of Minds” (EOM), a Reinforcement Learning (RL) framework for societies of LLMs and other
agents. Instead of using standard RL techniques to optimize the total reward of the system through
modifications of neural network parameters, EOMs use the principles of supply and demand in free
markets to assign credit (money) to those agents that contribute to economic success (reward).
The recent agent-based platform of DeepWisdom (AgentStore4) is compatible with the credit as-
signment concept of EOMs. Each agent in AgentStore provides a list of services with corresponding
costs. A convenient API is provided so that human users or agents in the platform can easily pur-
chase services from other agents to accomplish their services. Figure 6 displays the User Interface
(UI) of AgentStore, where various agents with different skills are showcased. Besides, individual
developers can participate in building new agents and enable collaborative development within the
community. Specifically, AgentStore allows users to subscribe to agents according to their demands
4http://beta.deepwisdom.ai
15
