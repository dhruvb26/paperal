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
True positive
False positive
<1e-3 <1e-3 <1e-3 <1e-3 <1e-3 <1e-3 <1e-3 <1e-3 <1e-3 <1e-3 <1e-3 <1e-3 <1e-3 0.01 <1e-3 <1e-3 <1e-3 <1e-3 <1e-3 <1e-3
1.00
1.00
1.00
1.00
1.00
1.00
1.00
1.00
1.00
0.98
1.00
1.00
1.00
1.00
1.00
0.98
1.00
1.00
1.00
0.58
0
1
Figure 4: p-values of dataset inference By applying dataset inference to Pythia-12b models with 1000
data points, we observe that we can correctly distinguish train and validation splits of the PILE with very
low p-values (always below 0.1). Also, when considering false positives for comparing two validation subsets,
we observe a p-value higher than 0.1 in all cases, indicating no false positives.
Score Aggregation
To aggregate scores from different MIAs, we (i) normalize feature values to
ensure that all features aggregated across various membership inference attacks are on a comparable scale.
Then, we (ii) adjust values of outliers before learning correlations with the classifier by replacing the
top and bottom 2.5% of outlier values with the mean of that (normalized) feature. Finally, we (iii) remove
outliers before performing t-test in Stage 3 once we have a single membership value from the regressor
outputs for each sample in the B splits of the suspect and validation sets. Once again we remove the top
and bottom 2.5% of outlier.
5.2
Assumptions for Dataset Inference
In order to operationalize dataset inference, we must obey certain assumptions on both the datasets (points
1 and 2 below), and the suspect language model (point 3 below).
1. The suspect train set and the unseen validation sets should be IID. This prevents the results from being
confounded due to distribution shifts (such as temporal shifts in the case of WikiMIA).
2. We must ensure no leakage between the (suspected) train and (unseen) validation sets. The validation
set should be strictly private, and only accessible to the victim.
3. We need access to the output loss of the suspect LLM in order to perform various MIAs.
5.3
Experimental Details
Datasets and Architectures
We perform dataset inference experiments on all 20 subsets of the PILE.
For experiments with false positives, we split the validation sets into two subsets of 500 examples each. In
all other experiments, we compare 1000 examples of train and validation sets of the PILE [Gao et al., 2020].
We perform dataset inference on models from the Pythia [Biderman et al., 2023] family at 410M, 1.4B,
6.9B, and 12B scales. These open-source models allow us to know exactly which examples trained on.
MIAs used
In our experiments, we aggregate 52 different Membership Inference Attacks (MIAs) in Stage
1 (many of which are overlapping and only differ in whether they capture the perplexity or the log-likelihood,
or contrast the ratios or differences of model predictions). For the linear regression model trained in Stage 2,
we train for 1000 updates over the data using simple weights over the 52 features. A total of 1000 examples
are saved for training the regressor to learn correlations for stage 2, except in the false positive experiments
where we use half the data. A complete list of all the MIAs used in our work is present in Appendix C.
5.4
Analysis and Results with Dataset Inference
We analyze the performance of LLM dataset inference on the Pythia suite of models [Biderman et al.,
2023] trained on the Pile dataset [Gao et al., 2020]. We separately perform dataset inference on each and
every subset of the PILE using the provided train and validation sets, and report the p-values for correctly
9
