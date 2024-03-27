# Scraper API

## Platforms

These are the platform can scrape at the moment:

1. **Coursera**

2. **OpenClassRooms**

3. **Fun-Mooc**

4. **Edraak**

5. **EDX**

6. **Unow**

7. **FutureLearn**

8. **Udemy**

9. **PluralSight**

## Endpoint:

```curl
curl -X POST "https://scraper-hbqd.onrender.com/api/scrape/[PLATFORM_NAME]" -H "Content-Type: application/json" -d '{"url":[COURSE_LINK]}'
```

Replace `[PLATFORM_NAME]` with the name of the platform you want to scrape data from. This could be a website or an online service.

Replace `[COURSE_LINK]` with the URL of the course you want to scrape data from.
