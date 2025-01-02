Preprint
Figure 11: The system interface design for “recommendation engine development” is generated by
the architect agent (zoom in for a better view).
E
MORE DISCUSSIONS
E.1
DEEP-SEATED CHALLENGES
MetaGPT also alleviates or solves these challenges with its unique designs:
Use Context Efficiently
Two sub-challenges are present. First, unfolding short natural language
descriptions accurately to eliminate ambiguity. Second, maintaining information validity in lengthy
contexts, enables LLMs to concentrate on relevant data without distraction.
Reduce Hallucinations
Using LLMs to generate entire software programs faces code halluci-
nation problems—-including incomplete implementation of functions, missing dependencies, and
potential undiscovered bugs, which may be more serious. LLMs often struggle with software gen-
eration due to vague task definitions. Focusing on granular tasks like requirement analysis and
package selection offers guided thinking, which LLMs lack in broad task solving.
E.2
INFORMATION OVERLOAD
In MetaGPT, we use a global message pool and a subscription mechanism to address “information
overload,” which refers to the problem of receiving excessive or irrelevant information. This issue
is dependent on specific applications. MetaGPT employs a message pool to streamline communi-
cation, ensuring efficiency. Additionally, a subscription mechanism filters out irrelevant contexts,
enhancing the relevance and utility of the information. This design is particularly crucial in soft-
26