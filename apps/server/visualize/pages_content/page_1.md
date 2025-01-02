Split A
Suspect
Features
(A)
Val
Features
(A)
Split A
,  0
,  1
Suspect
Features
(A)
Val
Features
(A)
, Attack
Stage 1: Aggregate Features with MIAs
+
Stage 2: Learn Correlations
Stage 3: Perform Dataset Inference
Split B
Split B
+Attack
{0.3, 0.1, ..., 0.2}
{0.9, 0.2, ..., 0.7}
T-Test
Train Linear Model
Stage 0: Victim approaches with a Suspect set
Claim:
LLM trained on Suspect set
Assumption:
Suspect set and Val set are IID
Val set is private to the victim 
Split A
Split B
Suspect Set
...
Split A
Split B
...
Val Set
Figure 1: LLM Dataset Inference. Stage 0: Victim approaches an LLM provider. The victim’s data
consists of the suspect and validation (Val) sets. A victim claims that the suspect set of data points was
potentially used to train the LLM. The validation set is private to the victim, such as unpublished data
(e.g., drafts of articles, blog posts, or books) from the same distribution as the suspect set. Both sets are
divided into non-overlapping splits (partitions) A and B. Stage 1: Aggregate Features with MIAs. The
A splits from suspect and validation sets are passed through the LLM to obtain their features, which
are scores generated from various MIAs for LLMs. Stage 2: Learn Correlations (between features and
their membership status). We train a linear model using the extracted features to assign label 0 (denoting
potential members of the LLM) to the suspect and label 1 (representing non-members) to the validation
features. The goal is to identify useful MIAs. Stage 3: Perform Dataset Inference. We use the B splits of
the suspect and validation sets, (i) perform MIAs on them for the suspect LLM to obtain features, (ii) then
obtain an aggregated confidence score using the previously trained linear model, and (iii) apply a statistical
T-Test on the obtained scores. For the suspect data points that are members, their confidence scores are
significantly closer to 0 than for the non-members.
Maini et al. [2021] presented an impossibility result suggesting that as the size of the training set increases,
the success of membership inference degrades to random chance. Is testing the membership of individual
sentences for LLMs trained for a single epoch on trillions of tokens of text data feasible? In our work, we
first demonstrate that previous claims of successful membership inference for individual text sequences in
LLMs [Mattern et al., 2023, Shi et al., 2024] are overly optimistic (Section 4). Our evaluation of the MIA
methods for LLMs reveals a crucial confounder: they detect (temporal) distribution shifts rather than the
membership of data points (as also concurrently observed by [Duan et al., 2024]). Specifically, we find that
these MIAs infer whether an LLM was trained on a concept rather than an individual sentence. Even when
the outputs of such MIAs (weakly) correlate with actual sentence membership, we find that they remain
very brittle across sentences from different data distributions, and no single MIA succeeds across all. Based
on our experiments, we conclude the discussion of MIAs with guidelines for future researchers to conduct
robust experiments, highlighting the importance of using IID splits (between members and non-members),
considering various data distributions, and evaluating false positives to mitigate confounding factors.
If membership inference attacks are so brittle, do content writers and private individuals have no recourse
to claim that LLM providers unfairly trained on their data? As an alternative to membership inference, we
advocate for a shift in focus towards dataset inference [Maini et al., 2021], which is a statistically grounded
method to detect if a given dataset was in the training set of a model. We propose a new dataset inference
method for LLMs that aims at detecting sets of text sequences by specific authors, thereby offering a more
viable approach to dataset attribution than membership inference. Our method is presented in Figure 1.
The motivation behind dataset inference stems from the observation that in the rapidly evolving discourse
on copyright, individual data points have much less agency than sets of data points attributed to a particular
creator; and the fact that more often than not, cases of unfair use emerge in scenarios when multiple such
2
