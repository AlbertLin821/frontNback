using System.ComponentModel.DataAnnotations;

namespace BookSystem.Model
{
    public class Book
    {
        public int BookId { get; set; }

        [Required(ErrorMessage = "書名不可空白")]
        public string BookName { get; set; }

        [Required(ErrorMessage = "圖書類別不可空白")]
        public string BookClassId { get; set; }
        public string BookClassName { get; set; }

        [Required(ErrorMessage = "購買日期不可空白")]
        public string BookBoughtDate { get; set; }
        [Required(ErrorMessage = "借閱狀態不可空白")]
        public string BookStatusId { get; set; }
        public string BookStatusName { get; set; }

        [Required(ErrorMessage = "借閱人不可空白")]
        public string BookKeeperId { get; set; }
        public string BookKeeperCname { get; set; }
        public string BookKeeperEname { get; set; }
        [Required(ErrorMessage = "作者不可空白")]
        public string BookAuthor { get; set; }

        [Required(ErrorMessage = "出版商不可空白")]
        public string BookPublisher { get; set; }

        [Required(ErrorMessage = "內容簡介不可空白")]
        public string BookNote { get; set; }
    }
}
