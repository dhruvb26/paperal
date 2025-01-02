identifying the training dataset. Before diving into various design choices, the key result is that dataset
inference reliably finds the training distribution in all subsets of the PILE. (Figure 4). For the analysis
of false positives, we carry out dataset inference on two splits of the validation set for each subset of the
PILE. Since neither of the validation subsets was used to train the model fθ, the returned p-values should
be (and are) significantly above the selected threshold of 0.1 for any useful attribution framework. It is
worth noting that the p-values for these tests are often remarkably low in the order of 1e −30 and lower,
suggesting high confidence in attributing dataset ownership. When contrasted with the lack of reliability
of membership inference, dataset inference indeed shows great promise for future discourse on inspecting
training datasets. We will now dive deeper into various ablations and results around dataset inference such as
the features (membership inference attacks) chosen by the regressor, choice of pre-processing function, change
in performance of dataset inference with model size, data duplication and number of permitted queries.
Feature Selection.
For each domain, we find that the most prioritized metrics are different. This is the
reason that the linear classifier is essential to appropriately determine the importance of each feature for
determining per example membership, based on the dataset statistics. We present the results in Figure 5a.
For example, while the Perturbation-based metric is necessary to be present for the CC dataset, it is not
useful for the OWT2 dataset, which instead requires the Perplexity metric. Dataset inference automatically
learns which MIAs are positively correlated with a given distribution. The linear regressor can be trained
quickly on a CPU since it is only learning a weight assignment for each feature. Now, we investigate which
MIAs get selected by dataset inference by analyzing the importance weights given by our linear regression
to various MIAs.
Feature Pre-Processing.
Considering the chosen features, we explore various pre-processing techniques to
apply before training the linear regressor. The selected approach, referred to as Removal (Norm.) in Figure 5b,
involves eliminating outliers and normalizing the feature values. We tried other approaches such as mean
correction, and outlier clipping, but we found that these approaches make the dataset inference procedure
less reliable by artificially modifying the score distributions and modifying the feature correlations learned
by the linear model. Its effect can be seen through the occurrence of false positives for some of the datasets.
Number of Queries.
We analyze the number of queries that have to be executed against the tested
model fθ to determine if a given dataset was used for training. We present the results in Figure 6a. It can
be seen more than half of datasets only require about 100 points, while 1000 points are sufficient to obtain
p-values smaller than the significance threshold of 0.1 for all datasets.
Size of LLMs and Training Set Deduplication.
By studying the Pythia suite of models [Biderman
et al., 2023] which are trained on the same dataset, we observe the success of dataset inference is positively
correlated with the number of parameters in the LLMs. We present this result in Figure 6b as a violin
plot to allow for visualizing distributions of the datasets’ p-values. It can be seen as the size of the model
increases, the p-value distribution concentrates below the threshold of 0.1. This correlation can be explained
by the phenomenon that memorization by LLMs increases as their parameter size increases [Carlini et al.,
2021], which provides a stronger signal for the intermediate MIAs responsible for dataset inference to
succeed. We also contrast the models trained on deduplicated or non-deduplicated training sets when we
are only allowed 500 query points. Observe that while the aforementioned trend holds for both kinds of
models, the p-value distribution is more concentrated below 0.1 for the non-deduplicated models. Following
the same explanation as above, this also indicates that memorization is more severe when some training
data is duplicated, allowing various membership inference attacks to have a stronger signal.
10