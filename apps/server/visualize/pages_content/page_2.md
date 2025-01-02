sequences or their clusters naturally occur. For instance, consider the Harry Potter series written by J.K.
Rowling. Dataset inference tests whether a ‘dataset’ or a collection of paragraphs from her books was
used for training a language model, rather than testing the membership of individual sentences alone. We
also outline the specific framework required to operationalize dataset inference, including the necessary
assumptions for the same.
We carry out our analysis of dataset inference using LLMs with known training and validation data.
Specifically, we leverage the Pythia suite of models Biderman et al. [2023] trained on the Pile dataset Gao
et al. [2020] (Section 5). This controlled experimental setup allows us to precisely analyze the model
behavior on members and non-members when they occur IID (without any temporal shift) as the training
and validation splits of PILE are publicly accessible. Across all subsets, dataset inference achieves p-values
less than 0.1 in distinguishing between training and validation splits. At the same time, our method shows
no false positives, with our statistical test producing p-values larger than 0.5 in all cases when comparing
two subsets of validation data. To its practical merit, dataset inference requires only 1000 text sequences to
detect whether a given suspect dataset was used to train an LLM.
2
Background and Baselines
Membership Inference
(MI) [Shokri et al., 2017]. The central question is: Given a trained model and a
particular data point, can we determine if the data point was in the model’s training set? Applications of
MI methods span across detecting contamination in benchmark datasets [Oren et al., 2024, Shi et al., 2024],
auditing privacy [Steinke et al., 2023], and identifying copyrighted texts within pre-training data [Shafran
et al., 2021]. The field has been studied extensively in the realm of ML models trained via supervised
learning on small datasets. The ability of membership inference in the context of large-scale language
models (LLMs) remains an open problem. Recently, new methods [Mattern et al., 2023, Shi et al., 2024]
have been proposed to close the gap and we present them in § 2.1.
Dataset Inference
[Maini et al., 2021] provides a strong statistical claim that a given model is a
derivative of its own private training data. The key intuition behind the original method proposed for
supervised learning is that classifiers maximize the distance of training examples from the model’s decision
boundaries, while the test examples are closer to the decision boundaries since they have no impact on the
model weights. Subsequently, dataset inference was extended from supervised learning to the self-supervised
learning (SSL) models [Dziedzic et al., 2022] based on the observation that representations of the training
data points induce a significantly different distribution than the representation of the test data points. We
introduce dataset inference for large language models to detect datasets used for training.
2.1
Metrics for LLM Membership Inference
This section explores various metrics used to assess Membership Inference Attacks (MIAs) against LLMs.
We study MIAs under gray-box access (which assumes access to the model loss, but not to parameters or
gradients). The adversary aims to learn an attack function Afθ : X →{0, 1} that takes an input x from
distribution X and determines whether x was in the training set Dtrain of the LM fθ or not. Let us now
describe the MIAs we use in our work.
Thresholding Based.
These MIAs leverage loss [Yeom et al., 2018] or perplexity [Carlini et al., 2021] as
scores and then threshold them to classify samples as members or non-members. Specifically, the decision
rule for membership is: Afθ(x) = 1[L(fθ, x) < γ], where γ is a selected pre-defined threshold. However,
MIAs based solely on perplexity suffer from many false positives, where simple and predictable sequences
that never occur in the training set can be labeled as members.
3
