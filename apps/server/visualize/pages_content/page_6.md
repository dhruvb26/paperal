20
40
60
K
0.4
0.5
0.6
AUC
Model Parameters
410m
1.4b
6.9b
(a) Performance for different model sizes.
5.0
10.0
20.0
30.0
40.0
50.0
60.0
K
0.00
0.25
0.50
0.75
1.00
AUC
Min-K Prob
Reversed Train/Val
(b) False Positives when reversing train/val sets.
Figure 2: Comparative analysis of the Min-k% Prob [Shi et al., 2024].
We measure the
performance (a) across different model sizes and (b) the observed reversal effect. The method performs
close to a random guess on non-members from the Pile validation sets.
BookC2
Books3
CC
EuroParl
FreeLaw
Github
Gutenberg
HackerNews
Math
OWT2
OpenSubs
PhilPapers
PubMed Abs.
PubMed Cen.
Stack
USPTO
Ubuntu
Wiki
YTSubs
arXiv
Dataset
Max-10% Prob
Min-10% Prob
Perplexity
Perturbation-based
Reference-based
Zlib Ratio
Metric
0.49 0.43 0.45 0.48 0.49 0.47 0.44 0.48 0.49 0.47 0.45 0.38 0.57 0.46 0.35 0.44 0.65 0.46 0.62 0.47
0.48 0.46 0.51 0.49 0.50 0.50 0.51 0.53 0.49 0.52 0.50 0.52 0.51 0.49 0.49 0.48 0.42 0.59 0.55 0.48
0.54 0.57 0.53 0.51 0.50 0.50 0.54 0.48 0.52 0.50 0.54 0.59 0.48 0.53 0.63 0.55 0.30 0.47 0.40 0.53
0.53 0.55 0.52 0.45 0.53 0.48 0.59 0.54 0.48 0.50 0.56 0.70 0.32 0.52 0.42 0.48 0.47 0.48 0.55 0.51
0.57 0.52 0.49 0.50 0.49 0.49 0.47 0.42 0.50 0.48 0.52 0.42 0.53 0.50 0.50 0.53 0.45 0.45 0.45 0.50
0.48 0.56 0.52 0.47 0.51 0.50 0.51 0.49 0.51 0.48 0.57 0.69 0.36 0.54 0.60 0.50 0.43 0.50 0.45 0.55
0.00
0.25
0.50
0.75
1.00
Figure 3: Performance of various MIAs on different subsets of the Pile dataset. We report
6 different MIAs based on the best performing ones across various categories like reference based, and
perturbation based methods (Section 2.1). An effective MIA must have an AUC much greater than 0.5.
Few methods meet this criterion for specific datasets, but the success is not consistent across datasets.
datasets, (3) experiments must be performed over multiple data distributions (4) careful experimentation
must be done on both false positives and false negatives to ensure MIAs do not wrongly label non-members
as members.
5
LLM Dataset Inference
Dataset inference builds on the idea of membership inference by leveraging distributional properties to
determine if a model was trained on a particular dataset. While MIAs operate at the instance level—aiming
to identify whether each example was part of the training data. In the previous sections, we have shown
that MIAs often yield signals that is close to random in determining example membership. However, if
we achieve even slightly better than random accuracy in inferring membership, we can aggregate these
attacks across multiple examples to perform a statistical test. This test can then distinguish between the
distributions of the model’s training and validation sets. In the context of LLM dataset inference, we
combine all the MIA methods discussed in Section 2.1.
7
