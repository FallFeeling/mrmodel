"use client";

import { useEffect, useState } from "react";
import { formatCount } from "../format";
import type { CommentItem, InteractionThread, ThreadComment, VideoItem } from "../types";

type Props = {
  video: VideoItem;
  onClose: () => void;
};

type Tab = "interaction" | "transcript" | "comments";

function Avatar({ comment }: { comment: CommentItem }) {
  if (comment.user.avatar) {
    return <img className="comment-avatar" src={comment.user.avatar} alt="" referrerPolicy="no-referrer" />;
  }
  return <span className="comment-avatar avatar-fallback">{comment.user.nickname.slice(0, 1)}</span>;
}

function CommentMeta({ comment }: { comment: CommentItem }) {
  return (
    <span className="comment-meta">
      {comment.create_time_display || "时间未知"}
      {comment.ip_label ? ` · ${comment.ip_label}` : ""}
      <span>♡ {formatCount(comment.digg_count)}</span>
    </span>
  );
}

function AuthorReply({ reply }: { reply: CommentItem }) {
  return (
    <div className="author-reply">
      <div className="reply-accent" />
      <Avatar comment={reply} />
      <div className="comment-content">
        <div className="comment-heading">
          <strong>{reply.user.nickname}</strong>
          <span className="author-badge">作者</span>
          <span className="reply-time">{reply.create_time_display}</span>
        </div>
        <p>{reply.text}</p>
        <span className="comment-meta">♡ {formatCount(reply.digg_count)}</span>
      </div>
    </div>
  );
}

function InteractionCard({ thread }: { thread: InteractionThread }) {
  return (
    <article className="interaction-thread">
      <div className="comment-row">
        <Avatar comment={thread.parent} />
        <div className="comment-content">
          <div className="comment-heading">
            <strong>{thread.parent.user.nickname}</strong>
            {thread.author_liked && <span className="liked-badge">作者赞过</span>}
          </div>
          <p>{thread.parent.text}</p>
          <CommentMeta comment={thread.parent} />
        </div>
      </div>

      {thread.author_replies.map((reply) => (
        <AuthorReply reply={reply} key={reply.comment_id} />
      ))}

      {thread.parent.reply_total > 0 && (
        <span className="reply-total">共 {thread.parent.reply_total} 条回复</span>
      )}
    </article>
  );
}

function CommentThread({ comment, expanded, onToggle }: {
  comment: ThreadComment;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <article className="comment-thread-card">
      <div className="comment-row">
        <Avatar comment={comment} />
        <div className="comment-content">
          <div className="comment-heading">
            <strong>{comment.user.nickname}</strong>
            {comment.author_liked && <span className="liked-badge">作者赞过</span>}
          </div>
          <p>{comment.text}</p>
          <CommentMeta comment={comment} />
        </div>
      </div>

      {comment.replies.length > 0 && (
        <button className="expand-replies" type="button" onClick={onToggle} aria-expanded={expanded}>
          <span>{expanded ? "收起回复" : `展开 ${comment.replies.length} 条回复`}</span>
          <span className={expanded ? "chevron expanded" : "chevron"}>⌄</span>
        </button>
      )}

      {expanded && (
        <div className="reply-list">
          {comment.replies.map((reply) => (
            reply.is_author ? (
              <AuthorReply reply={reply} key={reply.comment_id} />
            ) : (
              <div className="regular-reply" key={reply.comment_id}>
                <Avatar comment={reply} />
                <div className="comment-content">
                  <div className="comment-heading"><strong>{reply.user.nickname}</strong></div>
                  <p>{reply.text}</p>
                  <CommentMeta comment={reply} />
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </article>
  );
}

function TranscriptPanel({ video }: { video: VideoItem }) {
  if (video.transcript_status === "complete" && video.transcript) {
    return (
      <div className="transcript-panel">
        <div className="transcript-summary">
          <span>本地转录</span>
          <strong>{video.transcript.segments.length} 个片段</strong>
          <p>Whisper {video.transcript.model} · 中文识别</p>
        </div>
        <div className="transcript-segments">
          {video.transcript.segments.map((segment, index) => (
            <div className="transcript-segment" key={`${segment.start}-${index}`}>
              <span>{segment.start_display}</span>
              <p>{segment.text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (video.transcript_status === "error") {
    return <StatusPanel label="转录失败" title="这条视频暂时没有生成文字" detail={video.transcript_error || "可稍后重新处理。"} />;
  }

  return <StatusPanel label="暂未处理" title="当前仅转录前 5 条视频" detail="这条视频会在后续批次中生成文字内容。" />;
}

function CommentsPanel({ video }: { video: VideoItem }) {
  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const comments = video.comments || [];
  const toggle = (commentId: string) => {
    setExpandedIds((current) => current.includes(commentId)
      ? current.filter((id) => id !== commentId)
      : [...current, commentId]);
  };

  if (video.comments_status === "complete") {
    return (
      <div className="comments-panel">
        <div className="comments-overview">
          <span>热度排序前 {comments.length} 条评论</span>
          <strong>含 {video.comment_reply_count || 0} 条展开回复</strong>
        </div>
        <div className="comments-list">
          {comments.map((comment, index) => (
            <div className="numbered-comment" key={comment.comment_id}>
              <span className="comment-index">{String(index + 1).padStart(2, "0")}</span>
              <CommentThread
                comment={comment}
                expanded={expandedIds.includes(comment.comment_id)}
                onToggle={() => toggle(comment.comment_id)}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (video.comments_status === "error") {
    return <StatusPanel label="读取失败" title="评论内容暂时不可用" detail="可以稍后重新抓取这条视频。" />;
  }

  return <StatusPanel label="暂未处理" title="当前仅深度读取前 5 条视频" detail="其余视频仍保留原有的首屏博主互动检测。" />;
}

function StatusPanel({ label, title, detail }: { label: string; title: string; detail: string }) {
  return (
    <div className="empty-interaction">
      <span>{label}</span>
      <h3>{title}</h3>
      <p>{detail}</p>
    </div>
  );
}

export function VideoModal({ video, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("interaction");

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    document.body.classList.add("modal-open");
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="video-modal" role="dialog" aria-modal="true" aria-label="视频详情" onMouseDown={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <span className="modal-kicker">视频 #{String(video.order).padStart(2, "0")}</span>
            <h2>{video.description}</h2>
            <p>{video.published_at} · 赞 {formatCount(video.like_count)} · 评 {formatCount(video.comment_count)}</p>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} aria-label="关闭">×</button>
          </div>
        </header>

        <nav className="modal-tabs" aria-label="详情分类">
          <button className={tab === "interaction" ? "active" : ""} onClick={() => setTab("interaction")}>
            博主互动 <span>{video.interaction_threads.length}</span>
          </button>
          <button className={tab === "transcript" ? "active" : ""} onClick={() => setTab("transcript")}>
            视频转录 {video.transcript_status === "complete" && <span>已完成</span>}
          </button>
          <button className={tab === "comments" ? "active" : ""} onClick={() => setTab("comments")}>
            评论 {video.comments_status === "complete" && <span>{video.comments?.length || 0}</span>}
          </button>
        </nav>

        <div className="modal-content">
          {tab === "interaction" && (
            video.interaction_threads.length ? (
              <div className="interaction-list">
                {video.interaction_threads.map((thread) => <InteractionCard thread={thread} key={thread.parent.comment_id} />)}
              </div>
            ) : (
              <StatusPanel label="暂无互动" title="当前评论范围内未检测到博主互动" detail={`已检测 ${video.comments?.length || video.scanned_top_comment_count} 条一级评论。`} />
            )
          )}
          {tab === "transcript" && <TranscriptPanel video={video} />}
          {tab === "comments" && <CommentsPanel video={video} />}
        </div>
      </section>
    </div>
  );
}
