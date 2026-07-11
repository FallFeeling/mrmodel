import { formatCount, formatDuration, shortDate } from "../format";
import type { VideoItem } from "../types";

type Props = {
  video: VideoItem;
  onOpen: (video: VideoItem) => void;
};

export function VideoCard({ video, onOpen }: Props) {
  const duration = formatDuration(video.duration_ms);

  return (
    <button className="video-card" type="button" onClick={() => onOpen(video)}>
      <span className="cover-wrap">
        <img className="video-cover" src={video.cover} alt="" loading="lazy" referrerPolicy="no-referrer" />
        <span className="cover-gradient" />
        <span className="video-rank">{String(video.order).padStart(2, "0")}</span>
        {duration && <span className="video-duration">{duration}</span>}
        {video.has_author_interaction && (
          <span className="interaction-badge">
            <span className="badge-dot" />博主互动
          </span>
        )}
      </span>

      <span className="card-body">
        <span className="video-copy">{video.description}</span>
        {(video.transcript_status === "complete" || video.comments_status === "complete") && (
          <span className="content-flags">
            {video.transcript_status === "complete" && <span>已转录</span>}
            {video.comments_status === "complete" && <span>20 条评论</span>}
          </span>
        )}
        <span className="video-meta">
          <span>{shortDate(video.published_at)}</span>
          <span className="meta-separator" />
          <span>赞 {formatCount(video.like_count)}</span>
          <span className="meta-separator" />
          <span>评 {formatCount(video.comment_count)}</span>
        </span>
      </span>
    </button>
  );
}
