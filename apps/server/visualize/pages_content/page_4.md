however, no additional information such as model weights or gradients. In the white-box access, we assume
full access to the model, where we can inspect model weights.
Operationalizing Dataset Inference.
Dataset inference for LLMs serves as a detection method for
data used to train an LLM. We consider the following three actors during a dispute:
1. Victim (V). We consider a victim creator whose private or copyrighted content was used to train an LLM
without explicit consent. The actor is presumed to have only black-box access to the suspect model,
which limits their ability to evaluate if their dataset was used in the LLM’s training process.
2. Suspect (A). The suspect (or potential adversary in this case) is an LLM provider who may have
potentially trained their model on the victim’s proprietary, or private data.
3. Arbiter. We assume the presence of an arbiter, i.e., a third-trusted party, such as law enforcement, that
executes the dataset inference procedure. The arbiter can obtain gray-box access to the suspect LLM.
For instance, in scenarios when API providers only give black-box access to users, legal arbiters may
have access to model loss to perform MIAs.
Scenario.
Consider a scenario where a book writer discovers that their publicly available but copyrighted
manuscripts have been used without their consent to train an LLM. The writer, the victim V
in this
case, gathers a small set of text sequences (say 100) from their manuscripts that they believe the model
was trained on. The suspect A in this scenario is the LLM provider, who may have included the writer’s
published work in their training data without obtaining explicit permission. The provider is under suspicion
of potentially infringing on the writer’s manuscripts. An arbiter, such as a law enforcement agency, steps in
to resolve the dispute. The arbiter obtains gray-box access to the suspect LLM, allowing them to execute
our dataset inference procedure and resolve the dispute. By performing dataset inference (as depicted in
Figure 1), the arbiter determines whether the writer’s published manuscripts were used in the training of the
LLM. This process highlights the practical application and significance of dataset inference in safeguarding
the rights of artists.
Notation.
We consider x to be an input sentence with N tokens x = x1, x2, ..., xN and fθ is a Language
Model (LM) with parameters θ. We can compute the probability of an arbitrary sequence fθ(x1, ..., xn),
and obtain next-token xn+1 predictions. For simplicity, assume that the next token is sampled under greedy
decoding, as the next token with the highest probability given the first n tokens.
4
Failure of Membership Inference
We demonstrate that the challenge of successfully performing membership inference for large language
models (LLMs) remains unresolved. This problem is inherently difficult because LLMs are typically trained
for a single epoch on trillions of tokens of web data. In their work, Maini et al. [2021] demonstrated a near
impossibility result (Theorem 2), suggesting that as the size of the training set increases, the success rate of
any MIA approaches 0.5 (as good as a coin flip). While this was shown in a simplified theoretical model, we
assess how this holds up for contemporary LLMs with billions of parameters. As a demonstrative example,
we consider the most recent (and supposedly best performing) work that proposed the Min-k% Prob [Shi
et al., 2024] membership inference attack, alongside a dedicated dataset to facilitate future evaluations.
In their work, they show that this method performs notably better than other MIAs such as perplexity
thresholding and DetectGPT that they benchmark their work against.
Temporal Shift and the Need for IID Analysis.
The evaluation dataset used to showcase the success
of Min-k% Prob was the WikiMIA dataset, a dataset constructed using spans of Wikipedia articles written
before (train set) and after the cut-off year 2023 (validation set). This was chosen considering the training of
the Pythia models [Biderman et al., 2023], which was based on scrapes of Wikipedia before 2023. Note that
such an evaluation setup naturally has the potential confounder of a temporal shift in the concepts in data
5