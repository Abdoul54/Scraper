# Scraper API

## Platforms

These are the platform can scrape at the moment:

-   **Coursera**

-   **OpenClassRooms**

-   **Fun-Mooc**

-   **Edraak**

-   **EDX**

-   **Unow**

-   **FutureLearn**

-   **Udemy**

## Endpoint:

```curl
curl -X POST "https://scraper-hbqd.onrender.com/api/scrape/[PLATFORM_NAME]" -H "Content-Type: application/json" -d '{"url":[COURSE_LINK]}'
```

Replace `[PLATFORM_NAME]` with the name of the platform you want to scrape data from. This could be a website or an online service.

Replace `[COURSE_LINK]` with the URL of the course you want to scrape data from.
