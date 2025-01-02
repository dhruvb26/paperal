Abstract
s. These results consolidate the finding that no single
MIA for LLMs works across all datasets, and we need to potentially find methods that adapt the choice
of metric to the distribution. In Section 5, we will leverage a (selective) combination of different MIAs to
improve over the performance of any single MIA in order to perform successful LLM Dataset Inference.
Guidelines for Future Research.
Based on our observations in this section, we outline four important
practices for future research in membership inference to enable sound experimentation and inferences. In
particular, (1) assessment for membership inference must be done in an IID setup where train and validation
splits are from the same distribution, (2) experiments must be repeated over multiple random splits of the
6
