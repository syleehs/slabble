## Analytics queries

Slabble events land in `s3://slabble-events/dt=YYYY-MM-DD/*.parquet` via Kinesis
Firehose, registered as Glue table `slabble.events`. Run these queries from
Athena (workgroup `primary` works fine; set a result location once).

### Quick daily check

```bash
bash docs/analytics/report.sh
```

Refreshes partitions, runs all three queries, and prints results as tables.
Override `WORKGROUP` and `RESULT_LOC` env vars if your Athena setup differs.

### Adding new partitions

Firehose writes new daily prefixes automatically, but Glue needs to be told.
Either run `MSCK REPAIR TABLE slabble.events` periodically, or:

```sql
ALTER TABLE slabble.events
ADD IF NOT EXISTS PARTITION (dt='2026-04-23')
LOCATION 's3://slabble-events/dt=2026-04-23/';
```

### Files

| Query | Question it answers |
|---|---|
| `funnel.sql` | How many users see a card, submit a guess, click share — per day, per game. |
| `grade_histogram.sql` | Distribution of guessed grades for a given puzzle — useful for tuning difficulty. |
| `retention.sql` | Day-over-day retention: of users who played day N, how many played day N+1, N+7, N+30. |
