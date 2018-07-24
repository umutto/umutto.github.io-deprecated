---
layout: post
title: "Transit ranges and isochrones over googlemaps"
date: 2018-02-18
---
This project was born out of personal needs and some free time. I've been looking around for a new place to move into in Tokyo. But being somewhat unfamiliar with the good areas that I would like to move into and places that I frequent, I was pretty lost on where to look. There are a lot of hidden gems that are cheaper in rent and close to hot spots, this was my quest. The code [can be seen here](https://github.com/umutto/Transit_range_isochrone_mapping) and the final result can be [seen here](https://umutto.github.io/Transit_range_isochrone_mapping/isochrone_maps/sample.html).

<p align="center">
  <img src="https://raw.githubusercontent.com/umutto/umutto.github.io/master/static/images/blog_0_transit_range/train_subway_map.png" alt="Tokyo Train and Subway Map"  width="600"/>  
  <br />
  <sup><i>Train and subway lines in Tokyo.</i></sup>
</p>  

Still not knowing anything, I figured if a place is close to my work and frequent bars, it would be a good candidate. More could be done by scrapping twitter and various websites to create a somewhat accurate quality map of an area but I was satisfied with friend recommendations and proximity to places I like.

For this, I've decided to list couple of stations that I would like to live close to and draw a polygon around the place that represents a 20-30minute range. The Idea was that I would be happy with an apartment 20-25 minutes to common districts, 30 minutes to my work etc.. So that I don't lose a lot of time on my commute and safely return after a night of drinking in the city centre. And since I don't have a drivers license in Japan, this range should be calculated using public transport and biking.

Drawing a circle based on birds eye view is simple enough, but due to many train lines, scheduling and maze like roads it hardly represents the reality. For this we need to use calculate the isochrone distances between points. At the moment of this project, google maps does not provide an isochrone or isoline polygon API so we have to calculate this distance by ourselves.

Firstly, Isochrone is defined as "a line drawn on a map connecting points at which something occurs or arrives at the same time". So in my understanding isochrone map is, contouring points that are at same range from an origin with respect to environmental effects (steepness, traffic, etc...) from a particular point. We can query the isoline distance between two points using google maps API, but can not magically find the ideal points in our desired distances.

For this I've simply calculated a bunch points at some distance from a location, and iteratively queried the distances between the starting location until it is in some threshold of what I want. In Layman terms, I've picked a central point, picked some points that are some kms away using a birds eye view and queried google maps if they are some minutes away or not. If they are less than some minutes I've picked a point further away in that direction, if they take more time I've picked a new point that is closer in that direction. The result is a polygon with points that are, say 15 minutes away from a central location using public transportation in each direction. Code may be a little bit more easy to understand for an engineer minded person.

```python
# direction and magnitude of isochronic point ranges
rad = [duration / 12] * number_of_angles
phi = [i * (360 / number_of_angles) for i in range(number_of_angles)]

# location/size of the step to take, similar to learning rate with time based decay
step = 0.5
step_decay = .025
step_base = 1
iso = [[0, 0]] * number_of_angles

# epoch is used to break prematurely if it takes too long
epoch = 0
while not converged and epoch <= epoch_limit:
    converged = True
    # get candidate point coordinates
    iso = [select_destination(geocode, phi[i], rad[i]) 
            for i in range(number_of_angles)]

    # Calculate transit distance between original point and predicted points
    # Google maps api can't return public transportation values for Tokyo yet... 
    # So it returns walking distances.
    data = google_maps.distance_matrix(origins=geocode, destinations=iso,
                                        mode=transportation_mode, 
                                        units="metric", 
                                        language="en",
                                        departure_time = departure_date, 
                                        transit_routing_preference = routing_preference,
                                        transit_mode = transit_mode)
    
    # google maps gets confused with the returned addresses, so coordinates are more robust
    data["destination_addresses"] = iso[:]

    for i in range(number_of_angles):  
        data_duration = data["rows"][0]["elements"][i]["duration"]["text"].split()
        data_duration = data_duration[0] if data_duration[1] == 'mins' else data_duration[0]*60
        data_duration = int(data_duration)

        # If selected point duration is smaller than wanted, make it bigger
        if data_duration < (duration - tolerance):
            rad[i] *= (step_base + step)
            converged = False
            
        # Else If selected points duration is bigger than wanted, make it smaller
        elif data_duration > (duration + tolerance):
            rad[i] /= (step_base + step)
            converged = False
            
        # Else, if points are within range, do nothing, 
        # if all points are good it is converged

    epoch += 1
```

I've called this function with multiple points of interest (with varying hyper-parameters) and finally created a polygon of points. Finally draw an overall shape that covers all other polygons for prettier results using shapely library and created an (yeah not a pretty way to do things) html file that covers the google maps controls along the polygon projections. Which can be [seen here as a map](https://umutto.github.io/Transit_range_isochrone_mapping/isochrone_maps/sample.html), or in the image below. The image below shows a heatmap of points that are 45 minutes from Shibuya, 40 minutes from Ueno etc [(which can be seen in the source code)](https://github.com/umutto/Transit_range_isochrone_mapping/blob/master/tokyo_ischrones_google_maps.py#L332-L351)..

<p align="center">
  <img src="https://raw.githubusercontent.com/umutto/umutto.github.io/master/static/images/blog_0_transit_range/map_results.png" alt="Isochrone mapping results"  width="600"/>  
  <br />
  <sup><i>Isochrone mapping results.</i></sup>
</p>  

At the end, these results were fun to interpret and somewhat helpful (I've ended up prioritizing rent and some other variables like station crowd etc.. but I've mainly used this map as a reference on where to look for). Based on my interest map says that Akihabara, Ikenoue etc.. is great (since they are really close to multiple places I frequent) while other very central places like Yotsuya, Shimbashi is not good since they are very central but still far away from the places that I am interested in. And finally, places like Kichioji and Koenji are great to live in but generally far away from my work so I've painted them with different weights.

I've picked a place with multiple overlaps and 15 minutes to my work, and I am really happy with it! 

---

- Sadly, google maps distance matrix API does not support queries for transit ranges (trains, busses etc.) in Japan as of this writing, so I've used walking distances instead.

- A second thing is, google maps API may sometimes return an address that it cannot interpret, maybe its better to try/catch or regex them. Neither of them are done in this project.
