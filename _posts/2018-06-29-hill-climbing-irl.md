---
layout: post
title: "Hill Climbing Algorithms (and gradient descent variants) IRL"
date: 2018-06-29
---
This blog post is going to be about, hill climbing algorithms and their common analogy (hill climbing duh...) including most used gradient descent algorithms. It is inspired by [Chris Foster](https://github.com/chrisfosterelli)'s [Executing gradient descent on the earth](https://fosterelli.co/executing-gradient-descent-on-the-earth) blog post. I've basically used the same structure and added new algorithms, refactored the code a bit for my understanding.  
  
# Introduction  
  
This analogy of a blind man going down the hill (finding minima) or blind man climbing a hill (finding maxima) is commonly used to give a better understanding of optimization algorithms. From this point, I will use maxima (climbing), but it is really easy to convert one model to other.

For starters, hill climbing optimization algorithms are iterative algorithms that start from an arbitrary solution(s) and incrementally try to make it better until no further improvements can be made or predetermined number of attempts been made. They usually follow a similar pattern of exploration-exploitation (intensification-diversification, selection-crossover-mutation etc..) using a cost function (or fitness function, optimization function etc..).

Deciding a step is whether an improvement or not is done by the cost function. Usually if a step is giving a lower cost, it is deemed to be an improvement. But different algorithms may decide differently on whether to take that step or do something else as well as how to decide on a candidate list of steps.

Now, this is where blind man climbing a hill analogy comes into place. Since the results of a cost function can be represented in hills and valleys, finding the optimal solution (the one gives good results for the given cost function) is very similar to climbing a mountainous field.

<p align="center">
  <img src="https://raw.githubusercontent.com/umutto/umutto.github.io/master/static/images/blog_1_hill_climb/loss_function_space_fig_1.jpg" alt="loss function"  width="600"/>  
  <br />
  <sup><i>An example loss function.</i></sup>
</p>  

 The real life problems are usually very high dimensional so this gets really hard to imagine, but the basis is the same. So in theory, these algorithms should do equally good job of climbing on real life surfaces.

# Project build up, defining the problem space

For more information, you can check the [original blog post](https://fosterelli.co/executing-gradient-descent-on-the-earth) from Chris Foster. I'll not go into details here, just talk about the differences, since it is very well written there.

Project uses NASA's [Shuttle Radar Topography Dataset](http://dwtkns.com/srtm/) to find out the elevation of a given coordinate. In the original blog post, the goal is to climb down to sea-level. This makes sense since it focuses on *gradient descent* and that is a minimizing solution. I've changed it to climb up a mountain, which in my mind translates better, and also since I was planning to work with other algorithms as well and found that it is more challenging to climb up in earth (reaching sea-level could be easy for an optimizer with large enough step size, since earth is full of sea... and full of global optima).

I've done that by not changing the algorithms but taking the inverse of the elevation values (it is easier since I only have to do it in one part of the code). This can be seen on *rastermap.py* module.

```python
    def get_cost(self, lat, lon):
        return self.get_elevation(lat, lon) * -1 + self.max_val
```

# Optimizers

Again, I will not go to details (there are tons of better tutorials online), but will try to give a general explanation to optimizers that I've used in this project.

### Gradient Descent

This is the simplest form of parameter update using the gradients. It selects the path that is along the negative direction of the gradient (for descent, positive direction would make it gradient ascent).

```python
    step = -alpha * slope
    theta += step
```

### Gradient Descent with Momentum

This is similar to gradient descent with extra inspiration from momentum in physics. Intuitively it makes a lot of sense, if a boll is rolling towards a direction for a while, it should go faster on the next step.

```python
    # velocity, starts from zero and kept (with some constant mu) from an earlier update
    velocity = mu * velocity - alpha * slope
    theta += velocity
```

### Gradient Descent with Nesterov Momentum

This is the same as Momentum with a lookahead, instead of a previous step momentum is calculated using a future approximation. This is easier to understand by a vector graph.

<p align="center">
  <img src="https://raw.githubusercontent.com/umutto/umutto.github.io/master/static/images/blog_1_hill_climb/nesterov_vector_fig_2.jpeg" alt="Nesterov vector"  width="600"/>  
  <br />
  <sup><i>Nesterov momentum vs momentum.</i></sup>
</p>  

And implemented as:

```python
    v_prev = np.copy(velocity)
    velocity = mu * velocity - alpha * slope

    step = -mu * v_prev + (1 + mu) * velocity

    theta += step
```

### Adagrad

This is a parameter update method with an adaptive learning rate. Motivation is to balance the weights that receive high gradients and low gradients by adapting their learning rate during epochs. Implementation is very simple, divide the updates by their previous magnitude.

```python
    cache += slope**2

    step = -alpha * slope / (np.sqrt(cache) + epsilon)

    theta += step
```

### RMSprop

This is a popular adaptive learning rate method that has born from a slide in Geoff Hinton's Coursera class. The idea is to reduce the aggressiveness in Adagrad by using a moving average of gradients instead.

```python
    cache = decay_rate * cache + (1 - decay_rate) * slope**2

    step = -alpha * slope / (np.sqrt(cache) + epsilon)

    theta += step
```

### Adam

This is one of the most popular methods right now, and usually first choice for many neural networks since it converges efficiently. Idea is similar to combining RMSprop with momentum.

```python
    t = i + 1

    m = beta1 * m + (1 - beta1) * slope
    mt = m / (1 - beta1**t)
    v = beta2 * v + (1 - beta2) * slope**2
    vt = v / (1 - beta2**t)

    step = -alpha * mt / (np.sqrt(vt) + epsilon)

    theta += step
```

---
So far, these have been gradient based algorithms. From here on, I've tried some of the more classical machine learning solutions.

### Stochastic hill climbing

This is a simple algorithm that looks at a random list of steps it can take and selects the one that improves the current solution (in our case reduces the loss). Since it only selects the better step, it is extremely prone to get stuck in a local minima, I've added extra steps of random choice to make it somewhat more viable.

```python
    for j in range(50):
        step, step_cost = random.choice(list(zip(steps, step_costs)))

        if step_cost <= cost:
            theta = step
            cost = step_cost
```

### Tabu search

This is similar to hill climbing algorithm with an additional list, it logs the steps taken and tries not to take those steps again. This list is called tabu and acts as a FIFO structure with limited size, so after some time those steps can be viable again.

```python
    steps = get_possible_steps(cand_t)

    cand_t = steps[0]
    for s in steps:
        if s not in tabu_list and rmap.get_cost(*s) < rmap.get_cost(*cand_t):
            cand_t = s

    if rmap.get_cost(*cand_t) < rmap.get_cost(*best_t):
        best_t = cand_t

    tabu_list.append(cand_t)
    if len(tabu_list) < tabu_size:
        del tabu_list[0]
```

### Simulated annealing

Simulated annealing got it's name from annealing in metallurgy. In short, it is a probabilistic optimization algorithm that may take bad steps with some probability (based on a temperature variable). This probability gets smaller after each step (cool down). While the algorithm explores radically at the beginning, it focuses on converging more at the final steps.

Probability of accepting a bad step is calculated as below.

```python
    def prob(c, n_c, t):
        p = np.e**((c - n_c) / t)
        if p >= np.random.random():
            return True
        return False
```

And the algorithm is implemented as below. I've added the extra loop to give it more chance of exploring-exploiting random steps.

```python
    if temp < min_temp:
        break

    steps = get_possible_steps(theta)
    step_costs = get_step_costs(rmap, steps)
    for j in range(50):
        step, step_cost = random.choice(list(zip(steps, step_costs)))
        if prob(cost, step_cost, temp):
            theta = step
            cost = step_cost

    temp *= alpha
```

# Results

In `run.py`, the selected optimizers are run and are logged into a `.csv` like file for every step they take and the elevations. For the location and parameters I've chosen for algorithms (location of my old university, and mostly original hyper-parameters from the papers). Elevation per step graph is as following.

<p align="center">
  <img src="https://raw.githubusercontent.com/umutto/umutto.github.io/master/static/images/blog_1_hill_climb/cost_plot_fig_3.png" alt="Elevation per step graph."  width="600"/>  
  <br />
  <sup><i>Elevation per step graph.</i></sup>
</p>  

Since the learning rate in gradient descent and alpha values in other optimization algorithms effect the step taken greatly, I've tried to feed values that equals the step size while keeping parameters similar to original papers for all algorithms. So, in reality the slopes of the lines may be different, but the final outcome should be somewhat similar.

This is an interesting graph to look at, it tells a lot about the intuition behind these algorithms. For example, gradient descent slowly keeps climbing (looks like it needs a higher learning rate but even here, it probably would continue and eventually reach the top) while momentum rushes into hills and rolls back, having a lot of jitter with its elevation before finally reaching the optima and starts to stabilize. Nesterov momentum on the other hand, makes smarter choices but still have a lot of jitter. While Adam, RMSprop and Adagrad have smoother converging lines. Stochastic hill climb and Tabu search seems to get stuck on local maxima or valleys, which may be because of bad parameters, but not an unexpected result.

Finally, we can see how these algorithms really act on real life surfaces using google maps:

<p align="center">
  <img src="https://raw.githubusercontent.com/umutto/umutto.github.io/master/static/images/blog_1_hill_climb/srtm_42_04_fig_4.gif" alt="Steps in real world surface."  width="600"/>  
  <br />
  <sup><i>Steps in real world surface.</i></sup>
</p> 
