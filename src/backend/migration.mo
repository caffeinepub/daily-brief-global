import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Storage "blob-storage/Storage";
import Time "mo:core/Time";

module {
  type IncomingActor = {
    videoStore : Map.Map<Nat, VideoLegacy>;
    commentStore : Map.Map<Nat, LegacyComment>;
    nextVideoId : Nat;
    nextCommentId : Nat;
  };

  type OutgoingActor = {
    pendingVideos : Map.Map<Nat, Video>;
    approvedVideos : Map.Map<Nat, Video>;
    rejectedVideos : Map.Map<Nat, Video>;
    comments : Map.Map<Nat, Comment>;
    nextVideoId : Nat;
    nextCommentId : Nat;
  };

  type VideoLegacy = {
    id : Nat;
    title : Text;
    url : Text;
    platform : Text;
    thumbnail : Storage.ExternalBlob;
    viewCount : Nat;
    likeCount : Nat;
    submittedAt : Time.Time;
  };

  type Video = {
    id : Nat;
    title : Text;
    url : Text;
    platform : { #youtube; #instagram; #other };
    thumbnail : Storage.ExternalBlob;
    viewCount : Nat;
    likeCount : Nat;
    submittedAt : Time.Time;
    status : VideoStatus;
  };

  type VideoStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type Comment = {
    id : Nat;
    videoId : Nat;
    text : Text;
    timestamp : Int;
  };

  type LegacyComment = {
    id : Nat;
    videoId : Nat;
    text : Text;
    timestamp : Int;
  };

  public func run(incomingActor : IncomingActor) : OutgoingActor {
    let defaultVideos = incomingActor.videoStore.map<Nat, VideoLegacy, Video>(
      func(_id, old) {
        {
          old with
          platform = #youtube : { #youtube; #instagram; #other };
          status = #approved : VideoStatus;
        };
      }
    );
    {
      pendingVideos = Map.empty<Nat, Video>();
      approvedVideos = defaultVideos;
      rejectedVideos = Map.empty<Nat, Video>();
      comments = incomingActor.commentStore.map<Nat, LegacyComment, Comment>(
        func(_id, legacyComment) { legacyComment },
      );
      nextVideoId = incomingActor.nextVideoId;
      nextCommentId = incomingActor.nextCommentId;
    };
  };
};
